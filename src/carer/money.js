/** P4 — Money: client expenses (§26) & pay / earnings (§27). Full-screen flows.
 * E9 adds the cash-safety gate (§26/§32 AC-26.7): physical opening/closing count,
 * offline-spend limit, high-value approval, and a stale-balance block. */
import { html, esc } from '../lib/dom.js'
import { fmtDMY } from '../lib/dates.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { NLW, PAY_PERIOD, THIS_PERIOD, YTD, HOLIDAY, PENSION, HMRC_MILEAGE, PAYSLIPS, getPayslip, payslipTotals, periodEstimate, TIMESHEET, gbp } from '../data/pay.js'

/** §7-style money parameters. */
const CASH = { OFFLINE_LIMIT: 20, HIGH_VALUE: 30, STALE_H: 24 }

/* ------------------------------------------------- §26 Client money & expenses */
export function renderExpenses() {
  const seed = [
    { what: 'Shopping for Mary Adams', amount: -24.60, at: '12:05', receipt: true },
    { what: 'Cash float received', amount: 40.00, at: '07:30', receipt: false },
  ]
  const inner = html`
    ${flowHeader({ title: 'Client money & expenses', subtitle: 'Mary Adams · Tue 30/06/2026', back: '#/carer/me' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4"
      x-data="{
        rows: ${esc(JSON.stringify(seed))},
        what: '', amount: '', captured: false, preview: '',
        opened: false, openCount: '', closeCount: '', offline: false,
        lastConfirmH: 30,   /* hours since office last confirmed the balance */
        get stale() { return this.lastConfirmH >= ${CASH.STALE_H} },
        get balance() { return this.rows.reduce((s, r) => s + Number(r.amount || 0), 0) },
        fmt(n) { return (n < 0 ? '−£' : '£') + Math.abs(n).toFixed(2) },
        onFile(e) {
          const f = e.target.files && e.target.files[0]; if (!f) return
          this.captured = true; this.preview = URL.createObjectURL(f)
        },
        openFloat() {
          const c = parseFloat(this.openCount)
          if (isNaN(c)) { window.__notify('Count the physical cash first','warning'); return }
          this.opened = true; window.__notify('Opening count recorded — matched to ledger','success')
        },
        add() {
          const amt = parseFloat(this.amount)
          if (!this.what.trim() || isNaN(amt)) { window.__notify('Enter a description and amount','warning'); return }
          if (!this.opened && amt < 0) { window.__notify('Do the opening cash count before spending','warning'); return }
          if (this.stale && amt < 0) { window.__notify('Balance is stale — contact the office before spending','warning'); return }
          const spend = Math.abs(Math.min(0, amt))
          if (this.offline && spend > ${CASH.OFFLINE_LIMIT}) { window.__notify('Over the £${CASH.OFFLINE_LIMIT} offline limit — needs office authorisation','warning'); return }
          if (spend >= ${CASH.HIGH_VALUE} && !this.captured) { window.__notify('High-value spend needs a receipt photo','warning'); return }
          this.rows.unshift({ what: this.what.trim(), amount: amt, at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), receipt: this.captured })
          this.what = ''; this.amount = ''; this.captured = false; this.preview = ''
          window.__notify('Expense recorded','success')
        },
        close() {
          const c = parseFloat(this.closeCount)
          if (isNaN(c)) { window.__notify('Count the remaining cash','warning'); return }
          const diff = (c - this.balance)
          window.__notify(Math.abs(diff) < 0.005 ? 'Closing count matches the ledger ✓' : 'Discrepancy £'+Math.abs(diff).toFixed(2)+' flagged to office', Math.abs(diff) < 0.005 ? 'success' : 'warning')
        }
      }">

      <!-- Balance card -->
      <div class="card p-4 bg-primary-700 text-white">
        <p class="text-xs font-medium text-primary-100 uppercase tracking-wide">Cash held for client</p>
        <p class="text-3xl font-bold mt-1" x-text="fmt(balance)"></p>
        <p class="text-[11px] text-primary-100 mt-1 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Append-only ledger · reconciled with the office</p>
        <p class="text-[11px] mt-1.5" :class="stale ? 'text-warning-200' : 'text-primary-100'" x-text="stale ? '⚠ Balance last confirmed '+lastConfirmH+'h ago — could be incomplete' : 'Balance confirmed by office recently'"></p>
      </div>

      <!-- Stale-balance block -->
      <template x-if="stale">
        <div class="rounded-xl bg-warning-50 ring-1 ring-warning-100 p-3 text-[13px] text-warning-800 flex items-start gap-2">${icon('alert', 'w-4 h-4 mt-0.5 shrink-0')}<span>Balance is <b>stale</b> (older than ${CASH.STALE_H}h). Spending is blocked until the office confirms the current balance. <button onclick="window.__notify('Balance confirmation requested from office','info')" class="underline font-semibold">Request confirmation</button></span></div>
      </template>

      <!-- Opening cash count (§26 AC-26.7) -->
      <div class="card p-4 space-y-3" x-show="!opened" x-cloak>
        <p class="text-sm font-semibold text-ink-900 flex items-center gap-2">${icon('shield', 'w-4 h-4 text-ink-400')}Opening cash count</p>
        <p class="text-[12px] text-ink-500">Physically count the cash before any spending. This is matched against the ledger.</p>
        <div><label class="label">Cash counted (£)</label><input type="number" step="0.01" x-model="openCount" class="field field-md" placeholder="e.g. 40.00" /></div>
        <button @click="openFloat()" class="btn btn-primary btn-md w-full">${icon('check', 'w-4 h-4')}Confirm opening count</button>
      </div>
      <div class="rounded-xl bg-success-50 ring-1 ring-success-100 p-2.5 text-[12px] text-success-700 flex items-center gap-1.5" x-show="opened" x-cloak>${icon('check-circle', 'w-3.5 h-3.5')}Opening count confirmed — spending unlocked.</div>

      <label class="card p-3 flex items-center gap-3 cursor-pointer">
        <input type="checkbox" x-model="offline" class="w-4 h-4 rounded" />
        <span class="flex-1 text-[13px] text-ink-700">Simulate working offline (spend limited to £${CASH.OFFLINE_LIMIT})</span>
        <span class="badge" :class="offline ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-ink-50 text-ink-500 ring-ink-200'" x-text="offline ? 'Offline' : 'Online'"></span>
      </label>

      <!-- Transactions -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Transactions</p>
        <div class="card divide-y divide-ink-100">
          <template x-for="(r, i) in rows" :key="i">
            <div class="flex items-center gap-3 p-3">
              <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="r.amount < 0 ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600'">
                <span x-show="r.amount < 0">${icon('arrow-right', 'w-4 h-4')}</span>
                <span x-show="r.amount >= 0">${icon('plus', 'w-4 h-4')}</span>
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold text-ink-800 truncate" x-text="r.what"></p>
                <p class="text-[11px] text-ink-400">
                  <span x-text="r.at"></span>
                  <template x-if="r.receipt"><span class="badge bg-teal-50 text-teal-700 ring-teal-100 ml-1">Receipt</span></template>
                </p>
              </div>
              <span class="text-[13px] font-semibold shrink-0" :class="r.amount < 0 ? 'text-danger-600' : 'text-success-600'" x-text="fmt(r.amount)"></span>
            </div>
          </template>
        </div>
      </div>

      <!-- Add expense -->
      <div class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-ink-900 flex items-center gap-2">${icon('plus', 'w-4 h-4 text-ink-400')}Add expense</p>
        <div>
          <label class="label">Description</label>
          <input type="text" x-model="what" placeholder="e.g. Newspaper & milk" class="field field-md" />
        </div>
        <div>
          <label class="label">Amount (£, use − for money spent)</label>
          <input type="number" step="0.01" x-model="amount" placeholder="-4.50" class="field field-md" />
        </div>
        <label class="rounded-xl ring-1 ring-ink-200 p-3 flex items-center gap-3 cursor-pointer active:bg-ink-50">
          <input type="file" accept="image/*" capture="environment" class="hidden" @change="onFile($event)" />
          <span class="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 grid place-items-center shrink-0">${icon('mobile', 'w-5 h-5')}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-[13px] font-semibold text-ink-800" x-text="captured ? 'Receipt photo captured' : 'Photograph receipt'"></span>
            <span class="block text-[11px] text-ink-400">Attach a clear photo for the audit trail</span>
          </span>
          <img x-show="captured" x-cloak :src="preview" class="w-10 h-10 rounded-lg object-cover ring-1 ring-ink-200" alt="Receipt preview" />
          <span x-show="!captured" class="text-ink-300">${icon('chevron-right', 'w-4 h-4')}</span>
        </label>
        <button type="button" @click="add()" class="btn btn-primary btn-md w-full">${icon('check', 'w-4 h-4')}Add to ledger</button>
      </div>

      <!-- Closing count / change returned (§26 AC-26.7) -->
      <div class="card p-4 space-y-3">
        <p class="text-sm font-semibold text-ink-900 flex items-center gap-2">${icon('check-circle', 'w-4 h-4 text-ink-400')}Closing count</p>
        <p class="text-[12px] text-ink-500">Count the remaining cash / change returned. Any discrepancy against the ledger is flagged to the office.</p>
        <div><label class="label">Cash remaining (£)</label><input type="number" step="0.01" x-model="closeCount" class="field field-md" placeholder="e.g. 15.40" /></div>
        <button @click="close()" class="btn btn-secondary btn-md w-full">${icon('shield', 'w-4 h-4')}Reconcile closing count</button>
      </div>

      <p class="text-center text-[11px] text-ink-400">Entries are append-only — corrections are logged, never overwritten.</p>
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------------ §27 Pay / earnings
 * Three tabs — This period (live estimate + NMW check + earned-wage access),
 * Payslips (monthly, → payslip detail with tax), Timesheet (day/week/month).
 * See src/data/pay.js for the model + the NMW / mileage rules behind it. */
const statusBadge = (s) => `<span class="badge ${s === 'Confirmed' ? 'bg-success-50 text-success-700 ring-success-100' : s === 'Pending' ? 'bg-warning-50 text-warning-700 ring-warning-100' : 'bg-danger-50 text-danger-700 ring-danger-100'}">${esc(s)}</span>`

export function renderPay() {
  const est = periodEstimate()
  const seg = (id, label) => `<button @click="tab='${id}'" :class="tab==='${id}' ? 'bg-white text-ink-900 shadow-[var(--shadow-card)]' : 'text-ink-500'" class="flex-1 h-9 rounded-lg text-sm font-semibold transition-colors">${label}</button>`
  const payRow = (ic, label, detail, amount) => `<div class="flex items-center gap-3 p-4"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon(ic, 'w-4 h-4')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${label}</p><p class="text-xs text-ink-500">${detail}</p></div><span class="text-sm font-semibold text-ink-700 shrink-0">${gbp(amount)}</span></div>`
  const ytdCell = (label, val) => `<div class="card p-3"><p class="text-lg font-bold text-ink-900">${val}</p><p class="text-xs text-ink-500">${label}</p></div>`

  const periodTab = html`
    <div x-show="tab==='period'" class="space-y-4">
      <div class="card p-5">
        <div class="flex items-center justify-between"><p class="section-title">Earned this month</p><span class="badge bg-warning-50 text-warning-700 ring-warning-100">${icon('clock', 'w-3 h-3')}Estimate</span></div>
        <p class="text-4xl font-bold text-ink-900 mt-1.5">${gbp(est.taxableGross)}</p>
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm">
          <span class="text-ink-500">${esc(PAY_PERIOD.range)} · paid automatically</span>
          <span class="inline-flex items-center gap-1 font-semibold text-success-600">▲ +${THIS_PERIOD.vsLastMonthPct}% vs last month</span>
        </div>
        <p class="text-sm text-ink-500 mt-1">Est. take-home <span class="font-semibold text-ink-700">${gbp(THIS_PERIOD.netProjection)}</span> after tax</p>
        <div class="flex items-end gap-2 h-16 mt-4">
          ${THIS_PERIOD.weeks.map((w) => { const mx = Math.max(...THIS_PERIOD.weeks.map((x) => x.amount)); return `<div class="flex-1 flex flex-col items-center gap-1"><div class="w-full rounded-t bg-primary-500" style="height:${Math.max(8, (w.amount / mx) * 44)}px"></div><span class="text-xs text-ink-400">${esc(w.label)}</span></div>` }).join('')}
        </div>
      </div>

      <div class="card p-4" x-data="{ tip:false }">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl grid place-items-center shrink-0 ${est.meetsNlw ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}">${icon(est.meetsNlw ? 'check-circle' : 'alert', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Effective rate ${gbp(est.effectiveRate)}/hr</p><p class="text-xs text-ink-500">${est.meetsNlw ? `Above National Living Wage (${gbp(NLW)})` : `Below National Living Wage (${gbp(NLW)}) — flag to office`} · includes travel time</p></div>
          <button type="button" @click.stop="tip=!tip" aria-label="What is the effective rate?" :class="tip ? 'bg-ink-100 text-ink-600' : 'text-ink-400'" class="w-7 h-7 rounded-full ring-1 ring-ink-200 grid place-items-center shrink-0 active:bg-ink-50">${icon('info', 'w-4 h-4')}</button>
        </div>
        <div x-show="tip" x-cloak @click.outside="tip=false" class="mt-3 rounded-lg bg-ink-50 p-3 text-xs text-ink-600 leading-relaxed animate-fade-in">
          Your <b>effective rate</b> is your total pay ÷ all your working time — <b>including travel between visits</b>. By law it must stay at or above the National Minimum / Living Wage (${gbp(NLW)}/hr for age 21+). If it ever drops below, tell your coordinator.
        </div>
      </div>

      <div>
        <p class="section-title mb-2">Breakdown</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${payRow('user-check', 'Contact time', `${THIS_PERIOD.contactHours} hrs × £12.00`, est.contact)}
          ${payRow('clock', 'Travel time', `${THIS_PERIOD.travelHours} hrs · counts for NMW`, est.travel)}
          ${payRow('sparkles', 'Weekend uplift', `${THIS_PERIOD.weekendHours} hrs · +15%`, est.weekend)}
          <div class="flex items-center gap-3 p-4 bg-ink-50"><p class="flex-1 text-sm font-bold text-ink-900">Gross pay</p><span class="text-sm font-bold text-ink-900">${gbp(est.taxableGross)}</span></div>
          ${payRow('map-pin', 'Mileage', `${THIS_PERIOD.miles} mi × 45p · tax-free, on top`, est.mileage)}
        </div>
      </div>

      <div class="card p-4 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('calendar', 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Next payment · ${esc(fmtDMY(PAY_PERIOD.payday))}</p><p class="text-xs text-ink-500">Your salary is paid automatically to your bank each month — nothing to request.</p></div>
      </div>

      <!-- holiday + pension (financial wellbeing — most care apps hide these) -->
      <div class="grid grid-cols-1 gap-3">
        <div class="card p-4 flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 grid place-items-center shrink-0">${icon('calendar', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Holiday · ${HOLIDAY.remainingDays} of ${HOLIDAY.entitlementDays} days left</p><p class="text-xs text-ink-500">Accrues ${HOLIDAY.accrualPct}% on every hour · next booked ${esc(HOLIDAY.nextBooked)}</p></div>
          <button onclick="window.__notify('Time-off request sent to the office','success')" class="btn btn-secondary btn-sm shrink-0">Book</button>
        </div>
        <div class="card p-4 flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('scale', 'w-5 h-5')}</span>
          <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Pension pot · ${gbp(PENSION.potValue)}</p><p class="text-xs text-ink-500">${esc(PENSION.provider)} · you ${PENSION.employeePct}% + employer ${PENSION.employerPct}% on top</p></div>
        </div>
      </div>

      <div>
        <p class="section-title mb-2">This tax year</p>
        <div class="grid grid-cols-2 gap-2.5">
          ${ytdCell('Gross pay', gbp(YTD.gross))}${ytdCell('Tax paid', gbp(YTD.tax))}${ytdCell('National Insurance', gbp(YTD.ni))}${ytdCell('Pension', gbp(YTD.pension))}
        </div>
        <p class="text-xs text-ink-400 mt-2 text-center">Tax code ${esc(YTD.taxCode)}</p>
      </div>

      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-sm text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>Estimates only. Final pay is confirmed by the office &amp; payroll. Query anything that looks wrong with your coordinator.</span></div>
    </div>`

  const payslipsTab = html`
    <div x-show="tab==='payslips'" x-cloak class="space-y-4">
      <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
        ${PAYSLIPS.map((p) => { const t = payslipTotals(p); return `<a href="#/carer/me/payslip/${p.id}" class="block p-4 flex items-center gap-3 active:bg-ink-50"><span class="w-9 h-9 rounded-xl bg-ink-100 text-ink-600 grid place-items-center shrink-0">${icon('file-check', 'w-4.5 h-4.5')}</span><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(p.month)}</p><p class="text-xs text-ink-500">Paid ${esc(fmtDMY(p.paidDate))}</p></div><div class="text-right shrink-0 flex items-center gap-2"><p class="text-sm font-bold text-ink-900">${gbp(t.net)}</p>${icon('chevron-right', 'w-4 h-4 text-ink-300')}</div></a>` }).join('')}
      </div>
      <p class="text-xs text-ink-400 text-center">Each payslip shows gross pay, tax, National Insurance &amp; pension. Tap for the full breakdown.</p>
    </div>`

  const labels = { day: TIMESHEET.day.map((d) => d.label), week: TIMESHEET.week.map((d) => d.label), month: TIMESHEET.month.map((d) => d.label) }
  const bounds = { day: TIMESHEET.day.length - 1, week: TIMESHEET.week.length - 1, month: TIMESHEET.month.length - 1 }
  const timesheetTab = html`
    <div x-show="tab==='timesheet'" x-cloak class="space-y-4" x-data="{ span:'day', i:{ day:0, week:0, month:0 }, max:${esc(JSON.stringify(bounds))}, labels:${esc(JSON.stringify(labels))} }">
      <!-- span selector -->
      <div class="flex gap-1 bg-ink-100 rounded-xl p-1">
        ${['day:Day', 'week:Week', 'month:Month'].map((s) => { const [id, l] = s.split(':'); return `<button @click="span='${id}'" :class="span==='${id}' ? 'bg-white text-ink-900 shadow-[var(--shadow-card)]' : 'text-ink-500'" class="flex-1 h-8 rounded-lg text-xs font-semibold">${l}</button>` }).join('')}
      </div>
      <!-- period navigator (page to a particular day / week / month) -->
      <div class="flex items-center gap-2">
        <button @click="if(i[span]<max[span])i[span]++" :disabled="i[span]>=max[span]" :aria-disabled="i[span]>=max[span]" class="btn btn-secondary btn-sm shrink-0" aria-label="Older visits">${icon('chevron-left', 'w-4 h-4')}Older</button>
        <span class="flex-1 text-center text-sm font-semibold text-ink-900 truncate" x-text="labels[span][i[span]]"></span>
        <button @click="if(i[span]>0)i[span]--" :disabled="i[span]<=0" :aria-disabled="i[span]<=0" class="btn btn-secondary btn-sm shrink-0" aria-label="Newer visits">Newer${icon('chevron-right', 'w-4 h-4')}</button>
      </div>
      ${['day', 'week', 'month'].map((k) => TIMESHEET[k].map((ts, idx) => `<div x-show="span==='${k}' && i.${k}===${idx}" x-cloak class="space-y-3">
        <div class="flex items-center justify-center">${statusBadge(ts.status)}</div>
        <div class="grid grid-cols-3 gap-2.5">
          <div class="card p-3 text-center"><p class="text-lg font-bold text-ink-900">${gbp(ts.pay)}</p><p class="text-xs text-ink-500">Earned</p></div>
          <div class="card p-3 text-center"><p class="text-lg font-bold text-ink-900">${esc(ts.hours)}</p><p class="text-xs text-ink-500">Paid hrs</p></div>
          <div class="card p-3 text-center"><p class="text-lg font-bold text-ink-900">${ts.miles}</p><p class="text-xs text-ink-500">Miles</p></div>
        </div>
        ${ts.hoursNote ? `<p class="text-xs text-ink-500 text-center -mt-1">Paid hrs = ${esc(ts.hoursNote)}</p>` : ''}
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${ts.rows.map((r) => `<div class="flex items-center gap-3 p-4"><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900 truncate">${esc(r.title)}</p><p class="text-xs text-ink-500 truncate">${esc(r.sub)}</p></div><div class="text-right shrink-0"><p class="text-sm font-bold text-ink-900 tabular-nums">${gbp(r.pay)}</p>${statusBadge(r.status)}</div></div>`).join('')}
        </div>
      </div>`).join('')).join('')}
      <!-- status key (non-colour cue + meanings) -->
      <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-ink-500">
        <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-success-500"></span>Confirmed by office</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-warning-500"></span>Pending confirmation</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-danger-500"></span>Queried by you</span>
      </div>
      <!-- auto-created: carers don't submit timesheets -->
      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-sm text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 mt-0.5 shrink-0')}<span>Your timesheet is created automatically from your clock-in &amp; clock-out at each visit, then confirmed by the office. Times are captured on the spot and every change is audit-logged — they can't be altered silently. Spot something wrong? <button onclick="window.__notify('Query raised with the office','info')" class="underline font-semibold">Query a visit</button>.</span></div>
    </div>`

  const inner = html`
    ${flowHeader({ title: 'Pay & earnings', subtitle: `${esc(PAY_PERIOD.label)} · ${esc(PAY_PERIOD.frequency)}`, back: '#/carer/me' })}
    <div class="flex flex-col h-full" x-data="{ tab:'period' }">
      <div class="px-4 pt-3 pb-1 shrink-0"><div class="flex gap-1 bg-ink-100 rounded-xl p-1">${seg('period', 'This month')}${seg('payslips', 'Payslips')}${seg('timesheet', 'Timesheet')}</div></div>
      <div class="flex-1 overflow-y-auto p-4">${periodTab}${payslipsTab}${timesheetTab}</div>
    </div>`
  return mobileFlow(inner)
}

/* -------------------------------------------------- Single payslip (with tax) */
export function renderPayslip({ id }) {
  const p = getPayslip(id)
  if (!p) return mobileFlow(html`${flowHeader({ title: 'Payslip', back: '#/carer/me/pay' })}${emptyMobile({ title: 'Payslip not found' })}`)
  const t = payslipTotals(p)
  const line = (label, detail, amount, opts = {}) => `<div class="flex items-center gap-3 p-4"><div class="flex-1 min-w-0"><p class="text-sm ${opts.bold ? 'font-bold' : 'font-semibold'} text-ink-900">${esc(label)}</p>${detail ? `<p class="text-xs text-ink-500">${esc(detail)}</p>` : ''}</div><span class="text-sm ${opts.bold ? 'font-bold' : 'font-semibold'} ${opts.tone || 'text-ink-900'} shrink-0 tabular-nums">${opts.minus ? '−' : ''}${gbp(amount)}</span></div>`
  const inner = html`
    ${flowHeader({ title: p.month, subtitle: `Payslip · paid ${esc(fmtDMY(p.paidDate))}`, back: '#/carer/me/pay', right: `<button onclick="window.__notify('Payslip PDF downloaded','success')" class="text-sm font-semibold text-primary-600">Download</button>` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="card p-5 text-center">
        <p class="section-title">Net pay</p>
        <p class="text-4xl font-bold text-ink-900 mt-1">${gbp(t.net)}</p>
        <p class="text-sm text-ink-500 mt-1">${esc(p.method)}</p>
      </div>

      <div>
        <p class="section-title mb-2">Earnings</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${p.earnings.map((e) => line(e.label, e.detail, e.amount)).join('')}
          ${p.mileage ? line('Mileage', `tax-free reimbursement · ${p.mileage.detail}`, p.mileage.amount, { tone: 'text-teal-700' }) : ''}
          <div class="flex items-center gap-3 p-4 bg-ink-50"><p class="flex-1 text-sm font-bold text-ink-900">Gross pay (taxable)</p><span class="text-sm font-bold text-ink-900 tabular-nums">${gbp(t.taxableGross)}</span></div>
        </div>
      </div>

      <div>
        <p class="section-title mb-2">Deductions</p>
        <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${p.deductions.map((d) => line(d.label, '', d.amount, { minus: true, tone: 'text-danger-600' })).join('')}
          <div class="flex items-center gap-3 p-4 bg-ink-50"><p class="flex-1 text-sm font-bold text-ink-900">Total deductions</p><span class="text-sm font-bold text-danger-600 tabular-nums">−${gbp(t.deductions)}</span></div>
        </div>
      </div>

      <div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
        ${line('Gross pay', '', t.taxableGross)}
        ${line('Deductions', '', t.deductions, { minus: true, tone: 'text-danger-600' })}
        ${p.mileage ? line('Mileage (tax-free)', '', t.mileage, { tone: 'text-teal-700' }) : ''}
        <div class="flex items-center gap-3 p-4 bg-primary-50"><p class="flex-1 text-base font-bold text-primary-900">Net pay</p><span class="text-base font-bold text-primary-900 tabular-nums">${gbp(t.net)}</span></div>
      </div>

      <!-- employer contribution + mileage clarity (transparency the rivals don't give carers) -->
      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3 text-xs text-teal-800 flex items-start gap-2">${icon('shield', 'w-4 h-4 mt-0.5 shrink-0')}<span>Your employer also pays <b>${PENSION.employerPct}%</b> into your ${esc(PENSION.provider)} pension on top of your salary — this is <b>not</b> deducted from you.${p.mileage ? ` Mileage is reimbursed at HMRC's full ${Math.round(HMRC_MILEAGE * 100)}p/mile, so there's no tax relief to reclaim.` : ''}</span></div>

      <button onclick="window.__notify('Query raised with the office — payroll will review this payslip','info')" class="btn btn-secondary btn-md w-full">${icon('flag', 'w-4 h-4')}Query this payslip</button>

      <p class="text-xs text-ink-400 text-center">Illustrative payslip · tax code ${esc(YTD.taxCode)}. Your official payslip is issued by payroll.</p>
    </div>`
  return mobileFlow(inner)
}
