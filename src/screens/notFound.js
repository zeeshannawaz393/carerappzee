import { page } from './_layout.js'
import { emptyState, btn } from '../components/ui.js'

export function notFound() {
  return page(emptyState({ icon: 'search', title: 'Page not found', body: 'That screen does not exist in this prototype.', action: btn('Back to dashboard', { href: '#/', icon: 'arrow-left' }) }))
}
