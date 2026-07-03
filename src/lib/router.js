/**
 * Hash router. Routes are patterns like '/templates/:id'. Each route maps to
 * a screen render function `(params, query) => htmlString`. The persistent app
 * shell re-renders only the content region on navigation.
 */
import Alpine from 'alpinejs'

const routes = []
let notFound = () => '<div class="p-8">Not found</div>'
let onRender = null // (html, route) => void  set by the shell

export function route(pattern, handler, meta = {}) {
  const keys = []
  const regex = new RegExp(
    '^' +
      pattern
        .replace(/\//g, '\\/')
        .replace(/:(\w+)/g, (_, k) => {
          keys.push(k)
          return '([^\\/]+)'
        }) +
      '$'
  )
  routes.push({ pattern, regex, keys, handler, meta })
}

export function setNotFound(fn) {
  notFound = fn
}

export function navigate(path) {
  if (location.hash.slice(1) === path) {
    handleRoute() // force re-render same route
  } else {
    location.hash = path
  }
}

export function currentPath() {
  return location.hash.slice(1) || '/'
}

export function onContentRender(fn) {
  onRender = fn
}

function parseQuery(str) {
  const q = {}
  if (!str) return q
  new URLSearchParams(str).forEach((v, k) => (q[k] = v))
  return q
}

export function handleRoute() {
  const raw = currentPath()
  const [pathname, queryStr] = raw.split('?')
  const query = parseQuery(queryStr)

  for (const r of routes) {
    const m = pathname.match(r.regex)
    if (m) {
      const params = {}
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])))
      const view = r.handler(params, query)
      onRender?.(view, r, { params, query })
      // re-init Alpine on freshly injected markup
      requestAnimationFrame(() => Alpine.initTree(document.getElementById('app')))
      window.scrollTo(0, 0)
      return
    }
  }
  onRender?.(notFound(), { meta: {} }, { params: {}, query })
}

export function startRouter() {
  window.addEventListener('hashchange', handleRoute)
  handleRoute()
}

export function matchedMeta() {
  const pathname = currentPath().split('?')[0]
  for (const r of routes) {
    if (pathname.match(r.regex)) return r.meta
  }
  return {}
}
