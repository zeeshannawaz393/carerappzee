/** Universal mobile state helpers — loading / empty / error / offline / sync. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'

/** Skeleton rows for loading states. */
export function skeletonList(n = 4) {
  return html`<div class="space-y-3 p-4">
    ${map(Array.from({ length: n }), () => html`
      <div class="card p-4 animate-pulse">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-ink-100"></div>
          <div class="flex-1 space-y-2"><div class="h-3 bg-ink-100 rounded w-2/3"></div><div class="h-2.5 bg-ink-100 rounded w-1/3"></div></div>
        </div>
        <div class="h-2 bg-ink-100 rounded-full mt-3"></div>
      </div>`)}
  </div>`
}

/** Centered mobile empty state. */
export function emptyMobile({ icon: ic = 'search', title, body, action = '' }) {
  return html`
    <div class="flex flex-col items-center justify-center text-center px-8 py-16 h-full">
      <div class="w-16 h-16 rounded-2xl bg-ink-100 text-ink-400 grid place-items-center mb-4">${icon(ic, 'w-8 h-8')}</div>
      <h3 class="text-base font-semibold text-ink-800">${esc(title)}</h3>
      ${body ? `<p class="text-sm text-ink-500 mt-1 max-w-xs">${esc(body)}</p>` : ''}
      ${action ? `<div class="mt-5">${action}</div>` : ''}
    </div>`
}

/** Error + retry. */
export function errorMobile({ title = 'Something went wrong', body = 'Please try again.', onretry = '' } = {}) {
  return html`
    <div class="flex flex-col items-center justify-center text-center px-8 py-16 h-full">
      <div class="w-16 h-16 rounded-2xl bg-danger-50 text-danger-500 grid place-items-center mb-4">${icon('warning', 'w-8 h-8')}</div>
      <h3 class="text-base font-semibold text-ink-800">${esc(title)}</h3>
      <p class="text-sm text-ink-500 mt-1 max-w-xs">${esc(body)}</p>
      ${onretry ? `<button onclick="${onretry}" class="btn btn-secondary btn-md mt-5">${icon('refresh', 'w-4 h-4')}Try again</button>` : ''}
    </div>`
}

/** Small sync / offline chip. */
export function syncChip(queued) {
  if (queued > 0) {
    return html`<button onclick="window.__carerSync && window.__carerSync()" class="inline-flex items-center gap-1.5 rounded-full bg-warning-50 text-warning-700 ring-1 ring-warning-100 px-2.5 py-1 text-[11px] font-semibold">${icon('wifi', 'w-3.5 h-3.5')}${queued} to sync</button>`
  }
  return html`<span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 text-success-700 ring-1 ring-success-100 px-2.5 py-1 text-[11px] font-semibold">${icon('check-circle', 'w-3.5 h-3.5')}Synced</span>`
}
