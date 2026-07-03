/** INBOX — baseline message list + thread (deepened in P3). */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileApp, mobileHeader, mobileFlow, flowHeader } from './frame.js'
import { emptyMobile } from './states.js'

export const MOCK_THREADS = {
  't-office': {
    id: 't-office', name: 'Riverside Office', kind: 'Office', unread: true,
    messages: [
      { from: 'office', text: 'Morning Aisha — Mary’s fluid target is now 1500ml/day. Please encourage fluids at every visit.', at: '07:05' },
      { from: 'office', text: 'Also her daughter Susan will be there at the tea visit.', at: '07:06' },
    ],
  },
  't-senior': {
    id: 't-senior', name: 'Daniel Roy (Senior)', kind: 'Senior carer', unread: true,
    messages: [{ from: 'senior', text: 'Are you able to cover Doris’s tea visit today? Priya is off sick.', at: '09:12' }],
  },
  't-broadcast': {
    id: 't-broadcast', name: 'Heatwave advisory', kind: 'Broadcast', unread: false,
    messages: [{ from: 'office', text: '🌡️ Heatwave today — encourage fluids, keep rooms ventilated, watch for signs of dehydration.', at: '06:30' }],
  },
}

export function renderInbox() {
  const threads = Object.values(MOCK_THREADS)
  const inner = html`
    ${mobileHeader({ title: 'Inbox', subtitle: `${threads.filter((t) => t.unread).length} unread`, right: `<a href="#/carer/oncall" class="w-10 h-10 rounded-full bg-white ring-1 ring-ink-200 text-ink-600 grid place-items-center active:bg-ink-50" title="On-call">${icon('bell', 'w-5 h-5')}</a>` })}
    <div class="p-4 space-y-4">
      <!-- On-call — kept as a distinct danger-tinted card (a safety action) -->
      <a href="#/carer/oncall" class="block rounded-2xl bg-danger-50 ring-1 ring-danger-100 p-4 flex items-center gap-3 active:bg-danger-100">
        <span class="w-10 h-10 rounded-xl bg-danger-100 text-danger-700 grid place-items-center shrink-0">${icon('shield', 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-danger-800">On-call &amp; emergency</p><p class="text-xs text-danger-600">Office · on-call manager · 999</p></div>
        ${icon('chevron-right', 'w-5 h-5 text-danger-400')}
      </a>

      <!-- Change requests — single clean neutral row -->
      <a href="#/carer/changes" class="block rounded-2xl bg-white ring-1 ring-ink-100 p-4 flex items-center gap-3 active:bg-ink-50">
        <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center shrink-0">${icon('flag', 'w-5 h-5')}</span>
        <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">Change requests</p><p class="text-xs text-ink-500">Raise a tracked change to a plan / task / medicine</p></div>
        ${icon('chevron-right', 'w-5 h-5 text-ink-300')}
      </a>

      <!-- Messages — one grouped card, hairline dividers (de-boxed) -->
      <div>
        <p class="section-title mb-2.5">Messages</p>
        ${threads.length ? html`<div class="rounded-2xl bg-white ring-1 ring-ink-100 divide-y divide-ink-100 overflow-hidden">
          ${map(threads, (t) => {
            const last = t.messages[t.messages.length - 1]
            const ic = t.kind === 'Broadcast' ? 'wifi' : t.kind === 'Senior carer' ? 'user-check' : 'bell'
            return html`<a href="#/carer/inbox/${t.id}" class="block p-4 active:bg-ink-50">
              <div class="flex items-center gap-3">
                <span class="w-11 h-11 rounded-full grid place-items-center shrink-0 ${t.unread ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-500'}">${icon(ic, 'w-5 h-5')}</span>
                <div class="flex-1 min-w-0"><div class="flex items-center gap-2"><p class="text-sm font-semibold text-ink-900 truncate">${esc(t.name)}</p>${t.unread ? '<span class="w-2 h-2 rounded-full bg-primary-500 shrink-0"></span>' : ''}</div><p class="text-xs text-ink-500 truncate">${esc(last.text)}</p></div>
                <span class="text-xs text-ink-400 shrink-0 tabular-nums">${esc(last.at)}</span>
              </div>
            </a>`
          })}
        </div>` : emptyMobile({ icon: 'bell', title: 'No messages', body: 'Messages from the office will appear here.' })}
      </div>
    </div>`
  return mobileApp(inner, { tab: 'inbox', badges: { inbox: 2 } })
}

export function renderThread({ threadId }) {
  const t = MOCK_THREADS[threadId]
  if (!t) return mobileFlow(html`${flowHeader({ title: 'Message', back: '#/carer/inbox' })}${emptyMobile({ title: 'Thread not found' })}`)
  const bubble = (m) => {
    const mine = m.from === 'me'
    return html`<div class="flex ${mine ? 'justify-end' : 'justify-start'}"><div class="max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-white ring-1 ring-ink-200 text-ink-800 rounded-bl-sm'}"><p>${esc(m.text)}</p><p class="text-xs mt-0.5 ${mine ? 'text-primary-200' : 'text-ink-400'}">${esc(m.at)}</p></div></div>`
  }
  const inner = html`
    ${flowHeader({ title: t.name, subtitle: t.kind, back: '#/carer/inbox', right: `<button onclick="window.__notify('Calling…','info')" aria-label="Call" class="w-9 h-9 rounded-full bg-white ring-1 ring-ink-200 text-ink-600 grid place-items-center active:bg-ink-50">${icon('bell', 'w-4.5 h-4.5')}</button>` })}
    <div class="flex-1 overflow-y-auto p-4 space-y-2.5 bg-ink-50/40">
      ${map(t.messages, bubble)}
    </div>
    <div class="p-3 border-t border-ink-200 bg-surface shrink-0" x-data="{ m:'' }">
      <div class="flex gap-2">
        <input x-model="m" class="field field-md" placeholder="Reply…" @keydown.enter="if(m.trim()){window.__notify('Message sent','success'); m=''}" />
        <button @click="if(m.trim()){window.__notify('Message sent','success'); m=''}" class="btn btn-primary btn-md !px-3">${icon('arrow-right', 'w-4 h-4')}</button>
      </div>
    </div>`
  return mobileFlow(inner)
}
