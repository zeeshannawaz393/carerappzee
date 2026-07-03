/** §14.4 — Night shift (waking & sleep-in): interval rounds, wake events, cross-midnight totals. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow, flowHeader } from './frame.js'
import { NIGHT_ROUNDS, getRota } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'

export function renderNightShift({ visit } = {}) {
  const rota = getRota(visit)
  const su = (rota && getServiceUser(rota.suId)) || getServiceUser('su-mary')

  const inner = html`
    ${flowHeader({ title: 'Night shift', subtitle: `${esc(su.name)} · Waking / sleep-in`, back: '#/carer' })}
    <div class="flex-1 overflow-y-auto p-4 space-y-4"
         x-data="{ quiet:true, mode:'waking', done:{}, wakes:[] }">
      <div :class="quiet ? 'bg-ink-900 text-white' : 'bg-surface ring-1 ring-ink-100'" class="rounded-2xl p-4 space-y-4 transition-colors">
        <!-- Quiet-mode banner -->
        <div :class="quiet ? 'bg-ink-800' : 'bg-ink-50'" class="rounded-xl p-3.5 flex items-start gap-3">
          <span :class="quiet ? 'bg-ink-700 text-ink-100' : 'bg-ink-100 text-ink-500'" class="w-9 h-9 rounded-lg grid place-items-center shrink-0">${icon('smile', 'w-4 h-4')}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold" :class="quiet ? 'text-white' : 'text-ink-900'">Low-disturbance night mode</p>
            <p class="text-[11px]" :class="quiet ? 'text-ink-300' : 'text-ink-500'">Dimmed screen, minimal prompts and quiet alerts to avoid waking <span x-text="'${esc(su.name)}'"></span>.</p>
          </div>
          <button @click="quiet=!quiet" :class="quiet ? 'bg-primary-500' : 'bg-ink-300'" class="relative w-11 h-6 rounded-full transition-colors shrink-0"><span :class="quiet ? 'translate-x-5' : ''" class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"></span></button>
        </div>

        <!-- Mode toggle: waking night / sleep-in -->
        <div :class="quiet ? 'bg-ink-800' : 'bg-ink-50'" class="rounded-xl p-1 flex gap-1">
          <button @click="mode='waking'" :class="mode==='waking' ? 'bg-primary-600 text-white' : (quiet ? 'text-ink-300' : 'text-ink-500')" class="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors">Waking night</button>
          <button @click="mode='sleep-in'" :class="mode==='sleep-in' ? 'bg-primary-600 text-white' : (quiet ? 'text-ink-300' : 'text-ink-500')" class="flex-1 py-2 rounded-lg text-[13px] font-semibold transition-colors">Sleep-in</button>
        </div>

        <!-- Shift-level check-in -->
        <div :class="quiet ? 'bg-ink-800' : 'bg-info-50'" class="rounded-xl p-3.5 flex items-start gap-3">
          <span :class="quiet ? 'bg-ink-700 text-info-200' : 'bg-info-100 text-info-600'" class="w-9 h-9 rounded-lg grid place-items-center shrink-0">${icon('check-circle', 'w-4 h-4')}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold" :class="quiet ? 'text-white' : 'text-info-800'">One check-in for the whole night</p>
            <p class="text-[11px]" :class="quiet ? 'text-ink-300' : 'text-info-700'">A single shift-level check-in covers the entire night — you don't clock in per round or task.</p>
          </div>
        </div>

        <!-- Interval rounds -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold uppercase tracking-wide" :class="quiet ? 'text-ink-400' : 'text-ink-400'">Interval rounds</p>
            <span class="text-[11px]" :class="quiet ? 'text-ink-400' : 'text-ink-400'"><span x-text="Object.values(done).filter(Boolean).length"></span>/${NIGHT_ROUNDS.length} recorded</span>
          </div>
          <div :class="quiet ? 'divide-ink-700' : 'divide-ink-100'" class="rounded-xl overflow-hidden divide-y" :style="quiet ? 'background:transparent' : ''">
            ${map(NIGHT_ROUNDS, (r, i) => html`<div :class="done[${i}] ? (quiet ? 'bg-success-900/40' : 'bg-success-50') : (quiet ? 'bg-ink-800' : 'bg-surface')" class="flex items-center gap-3 p-3 transition-colors">
              <span :class="done[${i}] ? 'bg-success-500 text-white' : (quiet ? 'bg-ink-700 text-ink-200' : 'bg-ink-100 text-ink-500')" class="w-10 h-10 rounded-lg grid place-items-center shrink-0 text-[13px] font-bold">${esc(r.time)}</span>
              <div class="flex-1 min-w-0">
                <p class="text-[13px] font-semibold" :class="quiet ? 'text-white' : 'text-ink-800'">${esc(r.task)}</p>
                <p class="text-[11px]" :class="done[${i}] ? 'text-success-500' : (quiet ? 'text-ink-400' : 'text-ink-400')" x-text="done[${i}] ? 'Round recorded' : 'Due ${esc(r.time)}'"></p>
              </div>
              <button @click="done[${i}]=true" :disabled="done[${i}]" :class="done[${i}] ? 'bg-success-500 text-white' : 'btn-secondary'" class="btn btn-sm shrink-0"><span x-text="done[${i}] ? 'Done' : 'Record round'"></span></button>
            </div>`)}
          </div>
          <p class="text-[11px] mt-2 flex items-center gap-1.5" :class="quiet ? 'text-warning-300' : 'text-warning-600'">${icon('flag', 'w-3.5 h-3.5')}A missed round is flagged to the office for follow-up.</p>
        </div>

        <!-- Wake events (sleep-in only) -->
        <div x-show="mode==='sleep-in'" x-cloak :class="quiet ? 'bg-ink-800' : 'bg-surface ring-1 ring-ink-100'" class="rounded-xl p-3.5 space-y-3">
          <div class="flex items-center gap-2">
            <span :class="quiet ? 'bg-ink-700 text-warning-200' : 'bg-warning-50 text-warning-600'" class="w-9 h-9 rounded-lg grid place-items-center">${icon('bell', 'w-4 h-4')}</span>
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-semibold" :class="quiet ? 'text-white' : 'text-ink-900'">Wake events</p>
              <p class="text-[11px]" :class="quiet ? 'text-ink-300' : 'text-ink-400'">Log each time you're woken to provide care.</p>
            </div>
          </div>
          <div x-data="{ reason:'', now(){ const d=new Date(); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0') } }" class="flex items-end gap-2">
            <div class="flex-1">
              <label class="text-[11px] font-medium block mb-1" :class="quiet ? 'text-ink-300' : 'text-ink-500'">Reason</label>
              <input type="text" x-model="reason" placeholder="e.g. Continence care" class="field field-md" />
            </div>
            <button @click="if(reason.trim()){ wakes.push({ time: now(), reason: reason.trim() }); reason='' }" class="btn btn-primary btn-md shrink-0">${icon('plus', 'w-4 h-4')}Add</button>
          </div>
          <div x-show="wakes.length" x-cloak :class="quiet ? 'divide-ink-700' : 'divide-ink-100'" class="rounded-lg divide-y">
            <template x-for="(w, wi) in wakes" :key="wi">
              <div class="flex items-center gap-3 py-2">
                <span :class="quiet ? 'bg-ink-700 text-ink-200' : 'bg-ink-100 text-ink-600'" class="px-2 py-0.5 rounded text-[12px] font-mono font-semibold" x-text="w.time"></span>
                <span class="flex-1 min-w-0 text-[13px]" :class="quiet ? 'text-ink-100' : 'text-ink-800'" x-text="w.reason"></span>
              </div>
            </template>
          </div>
          <p x-show="!wakes.length" x-cloak class="text-[12px] text-center py-2" :class="quiet ? 'text-ink-400' : 'text-ink-400'">No wake events logged — undisturbed so far.</p>
          <p class="text-[11px]" :class="quiet ? 'text-ink-400' : 'text-ink-400'">Wake events evidence disturbed periods for pay. This log records them; the app doesn't decide sleep-in pay.</p>
        </div>

        <!-- Cross-midnight note -->
        <div :class="quiet ? 'bg-ink-800' : 'bg-ink-50'" class="rounded-xl p-3.5 flex items-start gap-3">
          <span :class="quiet ? 'bg-ink-700 text-ink-200' : 'bg-ink-100 text-ink-500'" class="w-9 h-9 rounded-lg grid place-items-center shrink-0">${icon('clock', 'w-4 h-4')}</span>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold" :class="quiet ? 'text-white' : 'text-ink-900'">Spans the date boundary</p>
            <p class="text-[11px]" :class="quiet ? 'text-ink-300' : 'text-ink-500'">Rounds, 24-hour PRN ceilings and fluid totals are counted across midnight correctly for this single night shift.</p>
          </div>
        </div>

        <!-- Handover -->
        <button @click="window.__notify('Night summary handed over to morning carer','success')" class="btn btn-primary btn-md w-full">${icon('arrow-right', 'w-4 h-4')}End-of-night handover</button>
      </div>
    </div>`
  return mobileFlow(inner)
}
