/**
 * Carer session (auth stub) — persisted to localStorage. Drives the
 * splash → login → onboarding → app guard. No real credentials in the
 * prototype; sign-in is on-device only.
 */
const KEY = 'caretask.carer.session'

const DEFAULT = {
  loggedIn: false,
  onboarded: false,
  role: 'care-worker', // §5 — care-worker | senior-carer | team-lead
  carer: { name: 'Aisha Khan', initials: 'AK', role: 'Care Worker', org: 'Riverside Care', branch: 'Riverside — North' },
}

function load() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...DEFAULT }
  }
}
let s = load()
const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* quota */ }
}

export const session = {
  get() { return s },
  carer() { return s.carer },
  isLoggedIn() { return !!s.loggedIn },
  isOnboarded() { return !!s.onboarded },
  role() { return s.role || 'care-worker' },
  setRole(r) { s.role = r; save() },
  login() { s.loggedIn = true; save() },
  completeOnboarding() { s.onboarded = true; save() },
  logout() { s = { ...DEFAULT }; save() },
}

/**
 * Guard for the tabbed app routes. Returns a redirect route string if the
 * carer must authenticate/onboard first, else null.
 */
export function authRedirect() {
  if (!s.loggedIn) return '/carer/login'
  if (!s.onboarded) return '/carer/welcome'
  return null
}
