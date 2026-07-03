/** §24 — Point-of-care communication / translation aid. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { PHRASE_LANGS, CARE_PHRASES } from '../data/carer.js'

export function renderTranslate() {
  const inner = html`
    ${flowHeader({ title: 'Communication aid', subtitle: 'Point-of-care phrases', back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4" x-data="{ lang:0 }">
      <!-- language picker -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-ink-400 mb-2">Language</p>
        <div class="flex flex-wrap gap-2">
          ${map(PHRASE_LANGS, (l, i) => html`<button type="button" @click="lang=${i}" :class="lang===${i} ? 'bg-primary-600 text-white ring-primary-600' : 'bg-surface text-ink-700 ring-ink-200'" class="rounded-full px-3.5 py-1.5 text-[13px] font-semibold ring-1 transition-colors">${esc(l)}</button>`)}
        </div>
      </div>
      <!-- interpreter note -->
      <div class="rounded-xl bg-info-50 ring-1 ring-info-100 p-3 text-[13px] text-info-800 flex items-start gap-2">${icon('info', 'w-4 h-4 shrink-0 mt-0.5')}<span>This is a communication aid, not a substitute for a professional interpreter — the person may be entitled to one under the Accessible Information Standard.</span></div>
      <!-- phrase list -->
      <div class="space-y-2.5">
        ${map(CARE_PHRASES, (p, i) => html`<div class="card p-4" x-data="{ t:${esc(JSON.stringify(p.t))} }">
          <div class="flex items-start gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-ink-900">${esc(p.en)}</p>
              <p class="text-[15px] text-primary-700 mt-1" x-text="t[lang]"></p>
            </div>
            <button type="button" onclick="window.__notify('Playing audio…','info')" class="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 grid place-items-center shrink-0" aria-label="Speak phrase ${i + 1}">${icon('activity', 'w-4 h-4')}</button>
          </div>
        </div>`)}
      </div>
    </div>`
  return mobileFlow(inner)
}
