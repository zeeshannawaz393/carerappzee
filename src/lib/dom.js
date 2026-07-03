/**
 * Tiny DOM / templating helpers shared by every component.
 * Components are functions that return HTML strings; Alpine handles local
 * interactivity once the markup is in the DOM.
 */

/** Identity tag — lets editors highlight HTML in template literals. */
export const html = (strings, ...values) =>
  strings.reduce((acc, s, i) => acc + s + (values[i] ?? ''), '')

/** Escape user/content strings for safe interpolation into HTML. */
export function esc(value) {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Conditionally join class names. */
export function cx(...parts) {
  return parts
    .flat()
    .filter(Boolean)
    .join(' ')
}

/** Render an array of items with a map fn, joining to a single string. */
export function map(items, fn) {
  return (items || []).map(fn).join('')
}

export const qs = (sel, root = document) => root.querySelector(sel)
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel))
