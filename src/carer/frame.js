/**
 * Carer app shell — the self-contained mobile sub-app frame. Provides:
 *  - carerCanvas(): centres the phone on a neutral backdrop (office chrome is
 *    hidden in carer-mode).
 *  - mobileApp(): tabbed shell (Today/Clients/Inbox/Me) + active-visit pill.
 *  - mobileFlow(): full-screen flow (visit, auth) with no tab bar.
 */
import { html, esc } from '../lib/dom.js'
import { icon } from '../icons.js'
import { ROTA, getRota, PARAMS } from '../data/carer.js'
import { getServiceUser } from '../data/index.js'
import { carerStore } from '../lib/carerStore.js'

/** §50 — masked key-safe code: tap-to-reveal (audited), auto-remask, no clipboard. */
export function keySafe(code) {
  if (!code) return '<span class="text-sm text-ink-400">No key-safe code recorded</span>'
  return html`<div x-data="{ shown:false }" class="flex items-center gap-2">
    <span class="font-mono text-base tracking-[0.3em] select-none" oncopy="return false" x-text="shown ? '${esc(code)}' : '••••'"></span>
    <button type="button" @click="shown=!shown; if(shown){ window.__notify('Key-safe code revealed — audited','info'); setTimeout(()=>{shown=false}, ${PARAMS.KEYSAFEREVEAL_S * 1000}) }" class="text-[11px] font-semibold text-primary-600 inline-flex items-center gap-1">${icon('eye', 'w-3.5 h-3.5')}<span x-text="shown ? 'Hide' : 'Reveal'"></span></button>
    <span x-show="shown" x-cloak class="text-[10px] text-ink-400">auto-hides in ${PARAMS.KEYSAFEREVEAL_S}s</span>
  </div>`
}

/* ---- device frame ---- */
export function phoneFrame(inner) {
  return html`
    <div class="w-full" style="max-width:404px">
      <div class="rounded-[2.4rem] bg-ink-900 p-3 shadow-2xl">
        <div class="rounded-[1.95rem] bg-canvas overflow-hidden flex flex-col relative" style="height:min(860px,90vh)">
          <div class="absolute top-0 inset-x-0 h-7 flex items-center justify-center z-40 pointer-events-none"><span class="w-24 h-5 bg-ink-900 rounded-b-2xl"></span></div>
          ${inner}
        </div>
      </div>
    </div>`
}

export function carerCanvas(inner) {
  return html`<div class="min-h-full w-full grid place-items-center py-6 px-4">${phoneFrame(inner)}</div>`
}

/* ---- active visit detection ---- */
export function activeVisit() {
  for (const r of ROTA) {
    const c = carerStore.clock(r.id)
    if (c.in && !c.out) return { rota: r, su: getServiceUser(r.suId) }
  }
  return null
}

function activePill() {
  const av = activeVisit()
  if (!av) return ''
  return html`
    <a href="#/carer/visit/${av.rota.id}" class="mx-3 mb-1 flex items-center gap-2.5 rounded-xl bg-primary-600 text-white px-3 py-2 shadow-[var(--shadow-pop)] active:scale-[.99]">
      <span class="w-2 h-2 rounded-full bg-success-300 animate-pulse"></span>
      <span class="flex-1 min-w-0"><span class="block text-[13px] font-semibold truncate">Visit in progress — ${esc(av.su.name)}</span><span class="block text-[11px] text-primary-100">${esc(av.rota.visit)} · tap to resume</span></span>
      ${icon('arrow-right', 'w-4 h-4')}
    </a>`
}

/* ---- bottom tab bar ---- */
const TABS = [
  { id: 'today', label: 'Today', icon: 'calendar', href: '#/carer' },
  { id: 'clients', label: 'Clients', icon: 'users', href: '#/carer/clients' },
  { id: 'inbox', label: 'Inbox', icon: 'bell', href: '#/carer/inbox' },
  { id: 'me', label: 'Me', icon: 'user-check', href: '#/carer/me' },
]

function bottomNav(active, badges = {}) {
  return html`
    <nav class="shrink-0 border-t border-ink-200 bg-surface flex items-stretch">
      ${TABS.map((t) => {
        const on = t.id === active
        const badge = badges[t.id]
        return html`<a href="${t.href}" aria-label="${t.label}" ${on ? 'aria-current="page"' : ''} class="flex-1 flex flex-col items-center gap-0.5 py-2 relative ${on ? 'text-primary-700' : 'text-ink-400'}">
          <span class="relative">${icon(t.icon, 'w-5 h-5')}${badge ? `<span class="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-danger-500 text-white text-[9px] font-bold grid place-items-center">${badge}</span>` : ''}</span>
          <span class="text-[10px] font-medium">${t.label}</span>
        </a>`
      }).join('')}
    </nav>`
}

/** Tabbed app shell. */
export function mobileApp(inner, { tab, badges } = {}) {
  return carerCanvas(html`
    <div class="flex flex-col h-full">
      <div class="flex-1 overflow-y-auto">${inner}</div>
      ${activePill()}
      ${bottomNav(tab, badges)}
    </div>`)
}

/** Full-screen flow (no tab bar) — visits, auth, detail flows. */
export function mobileFlow(inner) {
  return carerCanvas(html`<div class="flex flex-col h-full">${inner}</div>`)
}

/** Back header for full-screen sub-flows.
 *  Light by default (dark text on a clean bar). Pass tone:'primary' for the
 *  legacy saturated blue band in the rare place it's still wanted. */
export function flowHeader({ title, subtitle, back = '#/carer', right = '', tone = 'plain' } = {}) {
  const dark = tone === 'primary'
  const bg = dark ? 'bg-primary-700 text-white' : 'bg-surface/95 backdrop-blur border-b border-ink-100 text-ink-900'
  const backCls = dark ? 'text-white ring-white/25 active:bg-white/10' : 'text-ink-600 ring-ink-200 bg-white active:bg-ink-50'
  const sub = dark ? 'text-primary-100' : 'text-ink-500'
  return html`
    <div class="${bg} px-4 pt-9 pb-3 shrink-0 flex items-center gap-3">
      <a href="${back}" aria-label="Back" class="w-9 h-9 rounded-full grid place-items-center ring-1 ${backCls}">${icon('chevron-left', 'w-5 h-5')}</a>
      <div class="min-w-0 flex-1"><h2 class="text-lg font-semibold truncate leading-tight">${esc(title)}</h2>${subtitle ? `<p class="text-xs ${sub} truncate">${esc(subtitle)}</p>` : ''}</div>
      ${right}
    </div>`
}

/** Placeholder for routes scheduled in a later phase (keeps nav alive). */
export function comingSoon(title, back = '#/carer') {
  return mobileFlow(html`
    ${flowHeader({ title, back })}
    <div class="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div class="w-16 h-16 rounded-2xl bg-primary-50 text-primary-500 grid place-items-center mb-4">${icon('sparkles', 'w-8 h-8')}</div>
      <h3 class="text-base font-semibold text-ink-800">${esc(title)}</h3>
      <p class="text-sm text-ink-500 mt-1 max-w-xs">This screen is designed in the plan and arrives in the next build phase.</p>
    </div>`)
}

/** Slim top header for tabbed screens.
 *  Light by default — blends into the canvas so the content leads (no blue bar).
 *  Title is the top-level page heading, so it may be the largest text here. */
export function mobileHeader({ title, subtitle, right = '', tone = 'plain' } = {}) {
  const dark = tone === 'primary'
  const bg = dark ? 'bg-primary-700 text-white' : 'bg-canvas text-ink-900'
  const sub = dark ? 'text-primary-100' : 'text-ink-500'
  return html`
    <div class="${bg} px-5 pt-9 pb-3 shrink-0">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0"><h1 class="text-xl font-bold truncate leading-tight">${esc(title)}</h1>${subtitle ? `<p class="text-sm ${sub} mt-0.5">${esc(subtitle)}</p>` : ''}</div>
        ${right}
      </div>
    </div>`
}
