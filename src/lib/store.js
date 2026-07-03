/**
 * Minimal app store. Holds the current role (for permission demos) and a
 * tiny pub/sub so the shell can react to role changes. Mock data lives in
 * /src/data — this is just session/UI state.
 */
const listeners = new Set()

const state = {
  role: 'Care Coordinator', // current acting role (permissions demo)
  sidebarCollapsed: false,
}

export const store = {
  get(key) {
    return state[key]
  },
  set(key, value) {
    state[key] = value
    listeners.forEach((fn) => fn(key, value))
  },
  subscribe(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}
