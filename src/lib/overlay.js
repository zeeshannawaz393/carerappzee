/**
 * Imperative overlay helpers: toasts, modal dialogs and right-side drawers.
 * Screens call these from inline handlers (exposed on window in main.js).
 */
import Alpine from 'alpinejs'
import { icon } from '../icons.js'
import { html } from './dom.js'

let seq = 0

/* ------------------------------------------------------------------ Toasts */
const TOAST_STYLES = {
  success: { ring: 'ring-success-500/30', bar: 'bg-success-500', ic: 'check-circle', icColor: 'text-success-600' },
  error: { ring: 'ring-danger-500/30', bar: 'bg-danger-500', ic: 'x-circle', icColor: 'text-danger-600' },
  info: { ring: 'ring-primary-500/30', bar: 'bg-primary-500', ic: 'info', icColor: 'text-primary-600' },
  warning: { ring: 'ring-warning-500/30', bar: 'bg-warning-500', ic: 'warning', icColor: 'text-warning-600' },
}

export function toast(message, type = 'success', title) {
  const root = document.getElementById('toast-root')
  const s = TOAST_STYLES[type] || TOAST_STYLES.info
  const id = `toast-${++seq}`
  const node = document.createElement('div')
  node.id = id
  node.className = `card w-80 overflow-hidden ring-1 ${s.ring} shadow-[var(--shadow-pop)] animate-pop-in`
  node.innerHTML = html`
    <div class="flex">
      <div class="w-1 ${s.bar}"></div>
      <div class="flex items-start gap-3 p-3.5 flex-1">
        <div class="${s.icColor} mt-0.5">${icon(s.ic, 'w-5 h-5')}</div>
        <div class="flex-1 min-w-0">
          ${title ? `<p class="text-sm font-semibold text-ink-900">${title}</p>` : ''}
          <p class="text-[13px] text-ink-600">${message}</p>
        </div>
        <button onclick="document.getElementById('${id}')?.remove()" class="text-ink-400 hover:text-ink-700">${icon('x', 'w-4 h-4')}</button>
      </div>
    </div>`
  root.appendChild(node)
  setTimeout(() => node.remove(), 4200)
}

/* ------------------------------------------------------------------ Modal */
export function openModal({ title, body, footer, size = 'md', icon: ic } = {}) {
  const root = document.getElementById('overlay-root')
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  root.innerHTML = html`
    <div class="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto animate-fade-in">
      <div class="fixed inset-0 bg-ink-900/40 backdrop-blur-[1px]" onclick="window.__closeModal()"></div>
      <div class="card relative ${widths[size]} w-full my-auto animate-pop-in">
        <div class="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
          ${ic ? `<div class="text-primary-600">${icon(ic, 'w-5 h-5')}</div>` : ''}
          <h3 class="text-base font-semibold text-ink-900 flex-1">${title || ''}</h3>
          <button onclick="window.__closeModal()" class="btn btn-ghost btn-sm -mr-2 !px-2">${icon('x', 'w-5 h-5')}</button>
        </div>
        <div class="px-5 py-4 max-h-[65vh] overflow-y-auto">${body || ''}</div>
        ${footer ? `<div class="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-ink-100 bg-ink-50/50 rounded-b-[var(--radius-card)]">${footer}</div>` : ''}
      </div>
    </div>`
  Alpine.initTree(root)
}

export function closeModal() {
  document.getElementById('overlay-root').innerHTML = ''
}

/* ------------------------------------------------------------------ Drawer */
export function openDrawer({ title, subtitle, body, footer, width = 'max-w-xl', badge } = {}) {
  const root = document.getElementById('overlay-root')
  root.innerHTML = html`
    <div class="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div class="fixed inset-0 bg-ink-900/40 backdrop-blur-[1px]" onclick="window.__closeDrawer()"></div>
      <div class="relative ${width} w-full h-full bg-surface shadow-2xl flex flex-col animate-slide-in-right">
        <div class="flex items-start gap-3 px-6 py-4 border-b border-ink-100">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold text-ink-900 truncate">${title || ''}</h3>
              ${badge || ''}
            </div>
            ${subtitle ? `<p class="text-[13px] text-ink-500 mt-0.5">${subtitle}</p>` : ''}
          </div>
          <button onclick="window.__closeDrawer()" class="btn btn-ghost btn-sm -mr-2 !px-2">${icon('x', 'w-5 h-5')}</button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5">${body || ''}</div>
        ${footer ? `<div class="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-ink-100 bg-ink-50/50">${footer}</div>` : ''}
      </div>
    </div>`
  Alpine.initTree(root)
}

export function closeDrawer() {
  document.getElementById('overlay-root').innerHTML = ''
}
