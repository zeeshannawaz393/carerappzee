/** Auth stub — login (PIN + biometric) and first-run onboarding. */
import { html, esc, map } from '../lib/dom.js'
import { icon } from '../icons.js'
import { mobileFlow } from './frame.js'
import { session } from './session.js'

/* ------------------------------------------------------------------ Login */
export function renderLogin() {
  const carer = session.carer()
  const inner = html`
    <div class="flex flex-col h-full bg-primary-800 text-white" x-data="{ pin:'', add(d){ if(this.pin.length<4){ this.pin+=d; if(this.pin.length===4) setTimeout(()=>window.__carerLogin(),150) } }, del(){ this.pin=this.pin.slice(0,-1) } }">
      <div class="flex-1 flex flex-col items-center justify-center px-8 pt-10">
        <span class="w-16 h-16 rounded-2xl bg-white/10 grid place-items-center ring-1 ring-white/20 mb-4">${icon('heart', 'w-8 h-8')}</span>
        <p class="text-xs text-primary-200">${esc(carer.org)} · ${esc(carer.branch)}</p>
        <h1 class="text-xl font-bold mt-1">Welcome back</h1>
        <p class="text-sm text-primary-200 mt-0.5">${esc(carer.name)}</p>
        <!-- pin dots -->
        <div class="flex gap-3 mt-8">
          <template x-for="i in 4" :key="i"><span class="w-3.5 h-3.5 rounded-full" :class="pin.length>=i ? 'bg-white' : 'bg-white/25'"></span></template>
        </div>
        <p class="text-[11px] text-primary-200 mt-3">Enter your 4-digit PIN</p>
      </div>
      <!-- keypad -->
      <div class="px-8 pb-8">
        <div class="grid grid-cols-3 gap-3">
          ${map([1, 2, 3, 4, 5, 6, 7, 8, 9], (d) => `<button @click="add('${d}')" class="h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 text-xl font-semibold active:bg-white/20">${d}</button>`)}
          <button @click="window.__carerLogin()" class="h-14 rounded-2xl bg-white/5 ring-1 ring-white/10 grid place-items-center" title="Biometric">${icon('user-check', 'w-6 h-6')}</button>
          <button @click="add('0')" class="h-14 rounded-2xl bg-white/10 ring-1 ring-white/15 text-xl font-semibold active:bg-white/20">0</button>
          <button @click="del()" class="h-14 rounded-2xl bg-white/5 ring-1 ring-white/10 grid place-items-center">${icon('x', 'w-6 h-6')}</button>
        </div>
        <button @click="window.__carerLogin()" class="w-full mt-4 h-12 rounded-2xl bg-white text-primary-800 font-semibold flex items-center justify-center gap-2 active:bg-primary-50">${icon('user-check', 'w-5 h-5')}Sign in with Face ID</button>
        <button onclick="window.__notify('Contact your coordinator to reset your PIN','info')" class="w-full mt-3 text-[13px] text-primary-200">Forgot PIN?</button>
      </div>
    </div>`
  return mobileFlow(inner)
}

/* --------------------------------------------------------------- Onboarding */
const SLIDES = [
  { icon: 'file-check', title: 'Record at the point of care', body: 'Complete tasks, medication and observations right in the person’s home — accurate and time-stamped.' },
  { icon: 'wifi', title: 'Works offline', body: 'No signal? Keep working. Everything is saved on your device and syncs automatically when you’re back online.' },
  { icon: 'shield', title: 'Safe & secure', body: 'Allergies, medication and safeguarding are always front and centre. Your safety matters too — lone-worker tools are built in.' },
]
const PERMISSIONS = [
  { key: 'location', icon: 'map-pin', label: 'Location', desc: 'Confirm you’re at the visit & get directions' },
  { key: 'notifications', icon: 'bell', label: 'Notifications', desc: 'Schedule changes & office messages' },
  { key: 'camera', icon: 'eye', label: 'Camera', desc: 'Photo evidence for skin & incidents' },
  { key: 'biometric', icon: 'user-check', label: 'Face / Touch ID', desc: 'Fast, secure sign-in' },
]

export function renderWelcome() {
  const inner = html`
    <div class="flex flex-col h-full" x-data="{ step:0, total:5, consent:false }">
      <div class="flex-1 flex flex-col">
        ${SLIDES.map((s, i) => html`
          <div x-show="step===${i}" x-cloak class="flex-1 flex flex-col items-center justify-center text-center px-8 animate-fade-in">
            <span class="w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 grid place-items-center mb-6">${icon(s.icon, 'w-10 h-10')}</span>
            <h1 class="text-xl font-bold text-ink-900">${esc(s.title)}</h1>
            <p class="text-sm text-ink-500 mt-2 max-w-xs">${esc(s.body)}</p>
          </div>`).join('')}

        <!-- permissions (step 3) -->
        <div x-show="step===3" x-cloak class="flex-1 overflow-y-auto px-6 pt-12 animate-fade-in">
          <h1 class="text-xl font-bold text-ink-900">Allow a few things</h1>
          <p class="text-sm text-ink-500 mt-1 mb-5">You can change these later in Settings.</p>
          <div class="space-y-2.5">
            ${map(PERMISSIONS, (p) => html`<div class="card p-3.5 flex items-center gap-3">
              <span class="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 grid place-items-center">${icon(p.icon, 'w-5 h-5')}</span>
              <div class="flex-1 min-w-0"><p class="text-sm font-semibold text-ink-900">${esc(p.label)}</p><p class="text-xs text-ink-400">${esc(p.desc)}</p></div>
              <span class="badge bg-success-50 text-success-700 ring-success-100">${icon('check', 'w-3 h-3')}Allow</span>
            </div>`)}
          </div>
        </div>

        <!-- consent (step 4) -->
        <div x-show="step===4" x-cloak class="flex-1 overflow-y-auto px-6 pt-12 animate-fade-in">
          <span class="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 grid place-items-center mb-4">${icon('shield', 'w-8 h-8')}</span>
          <h1 class="text-xl font-bold text-ink-900">Data & privacy</h1>
          <p class="text-sm text-ink-500 mt-2">You’ll record personal and health information about the people you support. Handle it confidentially and only capture photos where the person (or their representative) has consented.</p>
          <label class="flex items-start gap-2.5 mt-5 p-3 rounded-xl ring-1 ring-ink-200 cursor-pointer">
            <input type="checkbox" x-model="consent" class="w-5 h-5 rounded text-primary-600 mt-0.5" />
            <span class="text-sm text-ink-700">I understand my data protection and confidentiality responsibilities.</span>
          </label>
        </div>
      </div>

      <!-- footer -->
      <div class="p-5 shrink-0">
        <div class="flex justify-center gap-1.5 mb-4">
          <template x-for="i in total" :key="i"><span class="h-1.5 rounded-full transition-all" :class="step===(i-1) ? 'w-5 bg-primary-600' : 'w-1.5 bg-ink-200'"></span></template>
        </div>
        <div class="flex gap-2">
          <button x-show="step>0" @click="step--" class="btn btn-secondary btn-lg">${icon('chevron-left', 'w-5 h-5')}</button>
          <button x-show="step<4" @click="step++" class="btn btn-primary btn-lg flex-1">Continue</button>
          <button x-show="step===4" @click="consent ? window.__carerOnboard() : window.__notify('Please confirm to continue','warning')" :class="!consent && 'opacity-60'" class="btn btn-primary btn-lg flex-1">${icon('check', 'w-5 h-5')}Start using CareTask</button>
        </div>
      </div>
    </div>`
  return mobileFlow(inner)
}
