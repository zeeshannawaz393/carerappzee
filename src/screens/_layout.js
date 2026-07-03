import { html } from '../lib/dom.js'

/** Standard padded content container for full screens. */
export function page(inner, { max = 'max-w-7xl' } = {}) {
  return html`<div class="px-6 py-7"><div class="${max} mx-auto">${inner}</div></div>`
}

/** Full-bleed container (e.g. planner / carer). */
export function pageWide(inner) {
  return html`<div class="px-6 py-7"><div class="max-w-[1600px] mx-auto">${inner}</div></div>`
}
