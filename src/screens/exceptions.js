import { html, esc, map } from '../lib/dom.js'
import { page } from './_layout.js'
import { icon } from '../icons.js'
import { pageHeader, statCard, btn, badge, sectionCard, defList, severityBadge } from '../components/ui.js'
import { alertRow } from '../components/domain.js'
import { ALERTS, ALERT_ROUTING, CATEGORIES, category } from '../data/index.js'
import { openDrawer } from '../lib/overlay.js'
import { carerAlerts } from '../lib/officeBridge.js'

/** All alerts = carer-raised (live) + static office alerts. */
function allAlerts() { return [...carerAlerts(), ...ALERTS] }
function sevCounts(list) {
  const c = {}
  ;['info', 'low', 'medium', 'high', 'critical'].forEach((k) => (c[k] = list.filter((a) => a.severity === k && a.status !== 'closed').length))
  return c
}

const SEV_TONE = { critical: 'danger', high: 'danger', medium: 'warning', low: 'success', info: 'primary' }
const SEV_ICON = { critical: 'alert', high: 'alert', medium: 'warning', low: 'flag', info: 'info' }

/* Suggested follow-up actions keyed loosely by alert type. */
function suggestedActions(a) {
  const t = (a.type || '').toLowerCase()
  if (t.includes('medication')) return ['Call carer to confirm whether medication was given', 'Check eMAR for a matching outcome', 'Notify Registered Manager if no record found', 'Log a medication incident if a dose was missed']
  if (t.includes('skin')) return ['Request a body-map photo from the carer', 'Add a daily pressure-area check task', 'Escalate to district nurse / GP if breaking skin', 'Update the skin integrity risk assessment']
  if (t.includes('two-carer') || t.includes('breach')) return ['Confirm the transfer was carried out safely', 'Re-check the moving & handling risk assessment', 'Review the rota for double-up cover', 'Record a safeguarding concern if injury occurred']
  if (t.includes('fluid') || t.includes('hydration')) return ['Review the running fluid total for today', 'Add a bedtime top-up prompt', 'Check for signs of dehydration on the next visit', 'Inform the family and GP if persistent']
  if (t.includes('food') || t.includes('nutrition')) return ['Review recent food intake records', 'Offer fortified meals / snacks', 'Consider a MUST nutritional screen', 'Refer to dietitian if weight loss continues']
  if (t.includes('refus')) return ['Call to understand the reason for refusal', 'Record consent and capacity considerations', 'Review the care plan approach with the carer', 'Escalate to Care Coordinator if repeated']
  if (t.includes('mood') || t.includes('wellbeing')) return ['Arrange a wellbeing check-in visit', 'Review companionship and activity tasks', 'Inform the GP if low mood persists', 'Note any safeguarding concerns']
  if (t.includes('overdue')) return ['Reschedule the task on the next suitable visit', 'Confirm with the carer why it was missed', 'Check the weekly recurrence is still correct']
  return ['Review the linked task and visit record', 'Contact the carer for additional detail', 'Decide whether to acknowledge or escalate', 'Update the care plan if a pattern emerges']
}

export function renderExceptions() {
  const list = allAlerts()
  const sev = sevCounts(list)
  const open = list.filter((a) => a.status === 'open')

  const stats = ['critical', 'high', 'medium', 'low', 'info'].map((k) =>
    statCard({ label: `${SEVERITY_LABEL(k)} alerts`, value: sev[k] || 0, icon: SEV_ICON[k], tone: SEV_TONE[k] })
  )

  const dataAttrs = (a) => `data-sev="${a.severity}" data-status="${a.status}" data-cat="${a.taskCategory}"`

  return page(html`
    <div x-data="{ sev: 'all', status: 'open', cat: 'all',
      show(el){
        const s = el.dataset.sev, st = el.dataset.status, c = el.dataset.cat;
        return (this.sev==='all'||this.sev===s) && (this.status==='all'||this.status===st) && (this.cat==='all'||this.cat===c);
      },
      get visible(){ return [...this.$root.querySelectorAll('[data-sev]')].filter(e=>this.show(e)).length }
    }">
      ${pageHeader({
        title: 'Exception Monitor',
        subtitle: 'Office follow-up of missed, refused and concern tasks — every exception is routed to the right person, acknowledged and closed off.',
        breadcrumbs: [{ label: 'Exception Monitor' }],
      })}

      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">${stats.join('')}</div>

      <div class="grid grid-cols-1 xl:grid-cols-[1fr_18rem] gap-6">
        <div>
          <!-- toolbar -->
          <div class="card p-3 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <span class="flex items-center gap-2 text-sm font-medium text-ink-500 shrink-0">${icon('filter', 'w-4 h-4')}Filters</span>
            <select x-model="sev" class="field field-md sm:w-40">
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="info">Info</option>
            </select>
            <select x-model="status" class="field field-md sm:w-44">
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="closed">Closed</option>
              <option value="all">All statuses</option>
            </select>
            <select x-model="cat" class="field field-md sm:w-52">
              <option value="all">All categories</option>
              ${map(CATEGORIES, (c) => `<option value="${c.id}">${esc(c.name)}</option>`)}
            </select>
            <span class="sm:ml-auto text-xs text-ink-500 pr-1" x-text="visible + ' exceptions'"></span>
          </div>

          <!-- alert list -->
          <div class="card overflow-hidden">
            ${map(list, (a) => `<div ${dataAttrs(a)} x-show="show($el)">${alertRow(a)}</div>`)}
            <div x-show="visible===0" x-cloak class="text-center text-sm text-ink-400 py-10">No exceptions match these filters.</div>
          </div>
        </div>

        <!-- routing legend -->
        <aside class="space-y-6 xl:sticky xl:top-4 self-start">
          ${sectionCard({
            title: 'Alert routing',
            icon: 'bell',
            pad: 'p-3',
            body: html`<ol class="space-y-1.5">${map(ALERT_ROUTING, (r, i) => html`
              <li class="flex items-center gap-3 px-2.5 py-2 rounded-lg ring-1 ring-ink-100">
                <span class="w-6 h-6 rounded-full bg-primary-50 text-primary-700 grid place-items-center text-xs font-semibold shrink-0">${i + 1}</span>
                <span class="text-sm font-medium text-ink-700">${esc(r)}</span>
              </li>`)}</ol>
              <p class="text-xs text-ink-500 mt-3">Exceptions escalate up this chain until acknowledged and closed.</p>`,
          })}
          <div class="card p-4">
            <p class="text-sm font-semibold text-ink-800">${open.length} open exceptions</p>
            <p class="text-xs text-ink-500 mt-1">Across ${new Set(open.map((a) => a.serviceUserId)).size} service users awaiting office follow-up.</p>
          </div>
        </aside>
      </div>
    </div>
  `)
}

function SEVERITY_LABEL(k) {
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', info: 'Info' }[k] || k
}

/* -------------------------------------------------- Alert detail drawer */
export function openAlertDrawer(id) {
  const a = allAlerts().find((x) => x.id === id)
  if (!a) return
  const c = category(a.taskCategory)
  const actions = suggestedActions(a)

  openDrawer({
    title: a.title,
    subtitle: `${a.type} · ${a.serviceUser}`,
    badge: severityBadge(a.severity),
    width: 'max-w-xl',
    body: html`
      <div class="space-y-5">
        ${sectionCard({ title: 'Details', icon: 'info', body: defList([
          { label: 'Type', value: a.type },
          { label: 'Service user', value: `<a href="#/service-users/${a.serviceUserId}/planner" class="text-primary-600 font-medium">${esc(a.serviceUser)}</a>` },
          { label: 'Template', value: a.template },
          { label: 'Category', value: c.name },
          { label: 'Visit', value: a.visit },
          { label: 'Time', value: a.time },
          { label: 'Carer', value: a.carer },
          { label: 'Routed to', value: badge(a.routedTo, 'bg-primary-50 text-primary-700 ring-primary-100', 'arrow-right') },
          { label: 'Status', value: badge(a.status, 'bg-ink-100 text-ink-600 ring-ink-200'), full: true },
        ]) })}

        ${sectionCard({ title: 'Suggested actions', icon: 'check-circle', body: html`
          <ul class="space-y-2">${map(actions, (act) => html`
            <li class="flex items-start gap-2.5">
              <input type="checkbox" class="w-4 h-4 rounded text-primary-600 mt-0.5 shrink-0" />
              <span class="text-sm text-ink-700">${esc(act)}</span>
            </li>`)}</ul>` })}

        <div class="rounded-lg bg-ink-50 ring-1 ring-ink-100 p-3.5">
          <p class="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1 flex items-center gap-1.5">${icon('info', 'w-3.5 h-3.5')}Why this was raised</p>
          <p class="text-sm text-ink-600">Generated automatically from the <span class="font-medium text-ink-700">${esc(a.template)}</span> task on the ${esc(a.visit)} visit. The ${esc(a.type.toLowerCase())} rule breached its threshold, so the exception was routed to the ${esc(a.routedTo)} for office follow-up.</p>
        </div>
      </div>`,
    footer:
      btn('Acknowledge', { variant: 'secondary', icon: 'check', onclick: `window.__officeRespond('acknowledged','${a.id}')` }) +
      btn('Escalate', { variant: 'primary', icon: 'arrow-right', onclick: `window.__officeRespond('escalated to the manager','${a.id}')` }) +
      btn('Resolve', { variant: 'teal', icon: 'check-circle', onclick: `window.__officeRespond('resolved','${a.id}')` }),
  })
}
