/** P3 — Notifications centre + on-call / emergency contacts. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'
import { carerAlerts, ALERT_LIFECYCLE } from '../lib/officeBridge.js'
import { SEVERITY } from '../data/index.js'

const NOTIFICATIONS = [
  { id: 'n1', group: 'Today', type: 'schedule', icon: 'calendar', tone: 'primary', title: 'Schedule change', body: 'Doris Finch tea visit added at 17:45 — Priya off sick.', time: '09:14', unread: true, href: '#/carer/inbox/t-senior' },
  { id: 'n2', group: 'Today', type: 'message', icon: 'bell', tone: 'primary', title: 'Riverside Office', body: 'Mary’s fluid target is now 1500ml/day.', time: '07:05', unread: true, href: '#/carer/inbox/t-office' },
  { id: 'n3', group: 'Today', type: 'broadcast', icon: 'wifi', tone: 'warning', title: 'Heatwave advisory', body: 'Encourage fluids, watch for dehydration.', time: '06:30', unread: false, href: '#/carer/inbox/t-broadcast' },
  { id: 'n4', group: 'Earlier', type: 'ack', icon: 'check-circle', tone: 'success', title: 'Alert acknowledged', body: 'Your INC-1001 fall report was received by the manager.', time: 'Yesterday', unread: false, href: '' },
  { id: 'n5', group: 'Earlier', type: 'task', icon: 'file-check', tone: 'teal', title: 'New task assigned', body: 'George Bell — record SpO₂ at tea visits this week.', time: 'Yesterday', unread: false, href: '#/carer/clients/su-george' },
]

const TONE = { primary: 'bg-primary-50 text-primary-600', warning: 'bg-warning-50 text-warning-600', success: 'bg-success-50 text-success-600', teal: 'bg-teal-50 text-teal-600' }

const DELIVERY = ['Provider accepted', 'Delivered to device', 'Seen', 'Acknowledged']

export function renderNotifications() {
  const groups = ['Today', 'Earlier']
  const inner = html`
    ${flowHeader({ title: 'Notifications', back: '#/carer', right: `<button onclick="window.__notify('All notifications marked read','success')" class="text-sm font-semibold text-primary-600">Mark all read</button>` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ denied:false }">
      <!-- §33 AC-33.4/33.5 — delivery states + denial hard policy -->
      <div class="card p-3.5">
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 flex items-center gap-1.5">${icon('bell', 'w-3.5 h-3.5')}Notification status</p>
          <label class="flex items-center gap-1.5 text-[11px] text-ink-500"><input type="checkbox" x-model="denied" class="w-3.5 h-3.5 rounded" />Simulate denied</label>
        </div>
        <template x-if="!denied"><div class="mt-2 flex items-center gap-1">${DELIVERY.map((d, i) => `<div class="flex-1 flex flex-col items-center gap-1"><span class="w-2.5 h-2.5 rounded-full ${i < 3 ? 'bg-primary-500' : 'bg-ink-200'}"></span><span class="text-[8px] ${i < 3 ? 'text-ink-600' : 'text-ink-300'}">${d.split(' ')[0]}</span></div>`).join('<div class="h-px flex-1 bg-ink-200 mb-3"></div>')}</div></template>
        <template x-if="denied"><div class="mt-2 rounded-lg bg-danger-50 ring-1 ring-danger-200 p-2.5">
          <p class="text-[12px] font-semibold text-danger-800">${icon('alert', 'w-3.5 h-3.5')}Notifications denied — safety-critical work is blocked (hazard H26)</p>
          <p class="text-[11px] text-danger-700 mt-0.5">You can't reliably receive urgent alerts. Enable notifications, verify SMS fallback, or get office authorisation before starting a shift.</p>
          <div class="flex gap-1.5 mt-2"><button onclick="window.__notify('Notification permission re-requested','info')" class="btn btn-danger btn-sm">Enable</button><button onclick="window.__notify('SMS fallback verified — limited mode','warning')" class="btn btn-secondary btn-sm">Verify SMS</button></div>
        </div></template>
      </div>
      ${NOTIFICATIONS.length ? map(groups, (g) => {
        const items = NOTIFICATIONS.filter((n) => n.group === g)
        if (!items.length) return ''
        return html`<div>
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">${g}</p>
          <div class="space-y-2">
            ${map(items, (n) => html`<a href="${n.href || '#/carer/notifications'}" class="block card p-3.5 ${n.unread ? 'ring-primary-200' : ''} active:scale-[.99]">
              <div class="flex items-start gap-3">
                <span class="w-9 h-9 rounded-xl grid place-items-center shrink-0 ${TONE[n.tone]}">${icon(n.icon, 'w-4.5 h-4.5')}</span>
                <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><p class="text-sm font-semibold text-ink-900">${esc(n.title)}</p>${n.unread ? '<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>' : ''}</div><p class="text-[13px] text-ink-500">${esc(n.body)}</p></div>
                <span class="text-[11px] text-ink-400 shrink-0">${esc(n.time)}</span>
              </div>
            </a>`)}
          </div>
        </div>`
      }) : emptyMobile({ icon: 'bell', title: 'You’re all caught up', body: 'New alerts and messages will appear here.' })}
    </div>`
  return mobileFlow(inner)
}

/* ------------------------------------------------------- On-call / emergency */
const CONTACTS = [
  { name: 'Riverside Office', role: 'Care coordination', num: '01234 567 000', icon: 'home', tone: 'primary' },
  { name: 'On-call manager', role: '24/7 · R. Okafor', num: '07700 900 500', icon: 'shield', tone: 'warning' },
  { name: 'District nurses', role: 'Clinical support', num: '01234 567 111', icon: 'activity', tone: 'teal' },
  { name: 'Emergency services', role: 'Life-threatening only', num: '999', icon: 'alert', tone: 'danger' },
]
const CTONE = { primary: 'bg-primary-50 text-primary-600', warning: 'bg-warning-50 text-warning-600', teal: 'bg-teal-50 text-teal-600', danger: 'bg-danger-50 text-danger-600' }

export function renderOnCall() {
  const inner = html`
    ${flowHeader({ title: 'On-call & emergency', back: '#/carer/inbox' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-2.5">
      ${map(CONTACTS, (c) => html`<div class="card p-3.5 flex items-center gap-3">
        <span class="w-10 h-10 rounded-xl grid place-items-center ${CTONE[c.tone]}">${icon(c.icon, 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(c.name)}</p><p class="text-xs text-ink-400">${esc(c.role)} · ${esc(c.num)}</p></div>
        <button onclick="window.__notify('Calling ${esc(c.name)}…','info')" class="btn ${c.tone === 'danger' ? 'btn-danger' : 'btn-secondary'} btn-sm">${icon('bell', 'w-3.5 h-3.5')}Call</button>
      </div>`)}
      <div class="rounded-xl bg-teal-50 ring-1 ring-teal-100 p-3.5 mt-2"><p class="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">${icon('shield', 'w-3.5 h-3.5')}Lone-worker</p><button onclick="window.__notify('Safety check-in sent','success')" class="btn btn-teal btn-sm mt-1">Send safety check-in</button></div>
    </div>`
  return mobileFlow(inner)
}

/* --------------------------------------------- My raised alerts (§48) */
export function renderMyAlerts() {
  const alerts = carerAlerts()
  const sevBadge = (s) => { const m = SEVERITY[s] || SEVERITY.info; return `<span class="badge ${m.badge}"><span class="w-1.5 h-1.5 rounded-full ${m.dot}"></span>${m.label}</span>` }
  const inner = html`
    ${flowHeader({ title: 'My alerts', subtitle: `${alerts.length} raised` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <div class="rounded-xl bg-primary-50 ring-1 ring-primary-100 p-3 text-[13px] text-primary-800 flex items-center gap-2">${icon('bell', 'w-4 h-4')}Live status of alerts you raised. Critical alerts never auto-expire until resolved.</div>
      ${alerts.length ? map(alerts, (a) => {
        const idx = ALERT_LIFECYCLE.indexOf(a.lifecycle)
        const resolved = a.lifecycle === 'Resolved'
        return html`<div class="card p-3.5">
          <div class="flex items-center gap-2 flex-wrap">${sevBadge(a.severity)}<span class="text-xs font-medium text-ink-500">${esc(a.type)}</span><span class="ml-auto badge ${resolved ? 'bg-success-50 text-success-700 ring-success-100' : a.lifecycle === 'Escalated' ? 'bg-danger-50 text-danger-700 ring-danger-100' : 'bg-primary-50 text-primary-700 ring-primary-100'}">${esc(a.lifecycle)}</span></div>
          <p class="text-sm font-medium text-ink-800 mt-1.5">${esc(a.title)}</p>
          <p class="text-xs text-ink-400">${esc(a.serviceUser)} · ${esc(a.time)} · → ${esc(a.routedTo)}</p>
          <div class="mt-2.5 flex items-center gap-1">
            ${ALERT_LIFECYCLE.map((st, i) => `<div class="flex-1 flex flex-col items-center gap-1"><span class="w-2.5 h-2.5 rounded-full ${i <= idx ? (resolved ? 'bg-success-500' : 'bg-primary-500') : 'bg-ink-200'}"></span><span class="text-[8px] ${i <= idx ? 'text-ink-600 font-medium' : 'text-ink-300'}">${st.split(' ')[0]}</span></div>`).join('<div class="h-px flex-1 bg-ink-200 mb-3"></div>')}
          </div>
        </div>`
      }) : emptyMobile({ icon: 'check-circle', title: 'No alerts raised', body: 'Alerts you raise during visits will show their live status here.' })}
    </div>`
  return mobileFlow(inner)
}
