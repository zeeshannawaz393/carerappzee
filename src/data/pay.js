/** Carer pay model — rates, current-period estimate, monthly payslips, YTD, timesheet.
 *
 *  Front-end mock; figures are illustrative. Design follows UK domiciliary-care pay
 *  rules surfaced in research:
 *   • NMW/NLW is judged on total pay ÷ total WORKING time, and travel time between
 *     visits counts as working time — so the effective-rate (NMW) check below uses
 *     contact + travel hours in the denominator.
 *   • Mileage is a tax-free reimbursement (≤45p/mi), so it is added to net but
 *     excluded from taxable gross and from the effective-rate calc.
 */
export const NLW = 11.44 // National Living Wage (23+), £/hr — the legal floor
export const PAY_RATES = { contact: 12.0, travel: 12.0, mileage: 0.45, weekendUplift: 0.15, night: 12.9 }

export const PAY_PERIOD = { label: 'July 2026', frequency: 'Monthly', payday: '1 Aug 2026', range: '1–31 Jul' }

/** Running totals for the current (in-progress) pay period. */
export const THIS_PERIOD = {
  contactHours: 118.5,
  travelHours: 14.2,
  miles: 176,
  weekendHours: 22,
  weeks: [
    { label: 'Wk 1', amount: 372.4 },
    { label: 'Wk 2', amount: 418.9 },
    { label: 'Wk 3', amount: 401.2 },
    { label: 'Wk 4', amount: 439.5 },
  ],
  holidayBalanceDays: 16.5,
  netProjection: 1425.6, // take-home: gross 1632 less ~17.5% deductions (+ tax-free mileage 79.20)
  vsLastMonthPct: 4, // gross vs last month
}

/** Year-to-date (tax year), as of the latest payslip. */
// Tax year to date = the in-year payslips only (UK tax year starts 6 Apr), i.e. Apr+May+Jun.
// These reconcile exactly with the sum of those three payslips (payslipTotals).
export const YTD = { gross: 5707.5, tax: 517.94, ni: 206.2, pension: 285.39, holidayTakenDays: 6.5, taxCode: '1257L' }

export const HMRC_MILEAGE = 0.45 // HMRC Approved Mileage Allowance Payment (first 10,000 mi) — the tax-free ceiling
export const HOLIDAY = { entitlementDays: 28, takenDays: 11.5, remainingDays: 16.5, accrualPct: 12.07, nextBooked: '10–12 Aug 2026' }
export const PENSION = { provider: 'NEST', potValue: 4820.5, employeePct: 5, employerPct: 3, employeeYtd: 285.39, employerYtd: 171.23 }

export const PAYSLIPS = [
  {
    id: '2026-06', month: 'June 2026', paidDate: '1 Jul 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '132.0 hrs × £12.00', amount: 1584.0 },
      { label: 'Travel time', detail: '14.0 hrs × £12.00', amount: 168.0 },
      { label: 'Weekend uplift', detail: '52.7 hrs at weekend rate', amount: 142.2 },
    ],
    mileage: { detail: '172 mi × 45p', amount: 77.4 },
    deductions: [
      { label: 'PAYE tax', amount: 169.34 },
      { label: 'National Insurance', amount: 67.7 },
      { label: 'Pension · 5% auto-enrolment', amount: 94.71 },
    ],
  },
  {
    id: '2026-05', month: 'May 2026', paidDate: '1 Jun 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '140.0 hrs × £12.00', amount: 1680.0 },
      { label: 'Travel time', detail: '15.5 hrs × £12.00', amount: 186.0 },
      { label: 'Weekend uplift', detail: '44.4 hrs at weekend rate', amount: 120.0 },
      { label: 'Night premium', detail: '3 nights', amount: 38.7 },
    ],
    mileage: { detail: '188 mi × 45p', amount: 84.6 },
    deductions: [
      { label: 'PAYE tax', amount: 198.4 },
      { label: 'National Insurance', amount: 78.1 },
      { label: 'Pension · 5% auto-enrolment', amount: 101.25 },
    ],
  },
  {
    id: '2026-04', month: 'April 2026', paidDate: '1 May 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '128.0 hrs × £12.00', amount: 1536.0 },
      { label: 'Travel time', detail: '13.0 hrs × £12.00', amount: 156.0 },
      { label: 'Weekend uplift', detail: '35.8 hrs at weekend rate', amount: 96.6 },
    ],
    mileage: { detail: '160 mi × 45p', amount: 72.0 },
    deductions: [
      { label: 'PAYE tax', amount: 150.2 },
      { label: 'National Insurance', amount: 60.4 },
      { label: 'Pension · 5% auto-enrolment', amount: 89.43 },
    ],
  },
  {
    id: '2026-03', month: 'March 2026', paidDate: '1 Apr 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '136.0 hrs × £12.00', amount: 1632.0 },
      { label: 'Travel time', detail: '14.8 hrs × £12.00', amount: 177.6 },
      { label: 'Weekend uplift', detail: '40.9 hrs at weekend rate', amount: 110.4 },
      { label: 'Holiday pay', detail: '5 days taken', amount: 288.0 },
    ],
    mileage: { detail: '150 mi × 45p', amount: 67.5 },
    deductions: [
      { label: 'PAYE tax', amount: 210.6 },
      { label: 'National Insurance', amount: 82.3 },
      { label: 'Pension · 5% auto-enrolment', amount: 110.4 },
    ],
  },
  {
    id: '2026-02', month: 'February 2026', paidDate: '1 Mar 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '120.0 hrs × £12.00', amount: 1440.0 },
      { label: 'Travel time', detail: '12.0 hrs × £12.00', amount: 144.0 },
      { label: 'Weekend uplift', detail: '31.1 hrs at weekend rate', amount: 84.0 },
    ],
    mileage: { detail: '140 mi × 45p', amount: 63.0 },
    deductions: [
      { label: 'PAYE tax', amount: 128.2 },
      { label: 'National Insurance', amount: 52.6 },
      { label: 'Pension · 5% auto-enrolment', amount: 83.4 },
    ],
  },
  {
    id: '2026-01', month: 'January 2026', paidDate: '1 Feb 2026', status: 'Paid', method: 'BACS · a/c ••4471',
    earnings: [
      { label: 'Contact time', detail: '138.0 hrs × £12.00', amount: 1656.0 },
      { label: 'Travel time', detail: '15.0 hrs × £12.00', amount: 180.0 },
      { label: 'Weekend uplift', detail: '44.0 hrs at weekend rate', amount: 118.8 },
    ],
    mileage: { detail: '176 mi × 45p', amount: 79.2 },
    deductions: [
      { label: 'PAYE tax', amount: 205.4 },
      { label: 'National Insurance', amount: 80.2 },
      { label: 'Pension · 5% auto-enrolment', amount: 108.24 },
    ],
  },
]

export function getPayslip(id) {
  return PAYSLIPS.find((p) => p.id === id)
}

/** Payslip money maths — taxable gross, deductions, net (mileage added tax-free). */
export function payslipTotals(p) {
  const taxableGross = p.earnings.reduce((s, e) => s + e.amount, 0)
  const deductions = p.deductions.reduce((s, d) => s + d.amount, 0)
  const mileage = p.mileage ? p.mileage.amount : 0
  return { taxableGross, deductions, mileage, net: taxableGross - deductions + mileage }
}

/** Current-period running estimate + the effective-hourly-rate (NMW) check. */
export function periodEstimate() {
  const contact = THIS_PERIOD.contactHours * PAY_RATES.contact
  const travel = THIS_PERIOD.travelHours * PAY_RATES.travel
  const weekend = THIS_PERIOD.weekendHours * PAY_RATES.contact * PAY_RATES.weekendUplift
  const mileage = THIS_PERIOD.miles * PAY_RATES.mileage
  const taxableGross = contact + travel + weekend
  const workingHours = THIS_PERIOD.contactHours + THIS_PERIOD.travelHours // travel counts for NMW
  const effectiveRate = taxableGross / workingHours
  return { contact, travel, weekend, mileage, taxableGross, total: taxableGross + mileage, workingHours, effectiveRate, meetsNlw: effectiveRate >= NLW }
}

/** Timesheet is AUTO-CREATED from clock-in/out — carers don't submit it.
 *  Each span is a list, newest-first (index 0 = current), so the UI can page
 *  back to a particular day / week / month. Day = visit-level; week/month = summaries. */
export const TIMESHEET = {
  day: [
    { label: 'Today · Tue 30 Jun', hours: '4h 18m', hoursNote: '3h 30m with clients + 48m travel', miles: 14, pay: 57.9, status: 'Pending', rows: [
      { title: 'Doris Finch · Morning', sub: '08:00–08:45 · 45m · 2 mi', pay: 10.6, status: 'Confirmed' },
      { title: 'George Bell · Morning', sub: '09:10–09:40 · 30m · 3 mi', pay: 8.9, status: 'Confirmed' },
      { title: 'Mary Adams · Lunch', sub: '12:45–13:15 · 30m · 3 mi', pay: 9.1, status: 'Confirmed' },
      { title: 'Doris Finch · Lunch', sub: '13:40–14:10 · 30m · 1 mi', pay: 7.8, status: 'Pending' },
      { title: 'Mary Adams · Tea', sub: '17:00–17:45 · 45m · 3 mi', pay: 11.5, status: 'Queried' },
      { title: 'George Bell · Bed', sub: '20:30–21:00 · 30m · 2 mi', pay: 10.0, status: 'Confirmed' },
    ] },
    { label: 'Mon 29 Jun', hours: '3h 25m', hoursNote: '2h 45m with clients + 40m travel', miles: 9, pay: 41.9, status: 'Confirmed', rows: [
      { title: 'Doris Finch · Morning', sub: '08:00–08:45 · 45m · 2 mi', pay: 11.1, status: 'Confirmed' },
      { title: 'Mary Adams · Lunch', sub: '12:30–13:15 · 45m · 3 mi', pay: 11.3, status: 'Confirmed' },
      { title: 'George Bell · Tea', sub: '16:45–17:15 · 30m · 2 mi', pay: 8.2, status: 'Confirmed' },
      { title: 'Mary Adams · Bed', sub: '20:00–20:45 · 45m · 2 mi', pay: 11.3, status: 'Confirmed' },
    ] },
    { label: 'Sun 28 Jun', hours: '2h 15m', hoursNote: '1h 45m with clients + 30m travel', miles: 7, pay: 26.8, status: 'Confirmed', rows: [
      { title: 'Doris Finch · Morning', sub: '08:15–09:00 · 45m · 2 mi', pay: 10.6, status: 'Confirmed' },
      { title: 'Mary Adams · Lunch', sub: '12:45–13:15 · 30m · 3 mi', pay: 8.4, status: 'Confirmed' },
      { title: 'Doris Finch · Bed', sub: '20:30–21:00 · 30m · 2 mi', pay: 7.8, status: 'Confirmed' },
    ] },
    { label: 'Sat 27 Jun', hours: '3h 24m', hoursNote: '2h 55m with clients + 29m travel', miles: 12, pay: 43.1, status: 'Confirmed', rows: [
      { title: 'George Bell · Morning', sub: '08:00–08:40 · 40m · 3 mi', pay: 9.8, status: 'Confirmed' },
      { title: 'Doris Finch · Lunch', sub: '12:30–13:15 · 45m · 1 mi', pay: 11.1, status: 'Confirmed' },
      { title: 'Mary Adams · Tea', sub: '16:30–17:15 · 45m · 3 mi', pay: 11.3, status: 'Confirmed' },
      { title: 'George Bell · Bed', sub: '20:15–21:00 · 45m · 2 mi', pay: 10.9, status: 'Confirmed' },
    ] },
    { label: 'Fri 26 Jun', hours: '2h 38m', hoursNote: '2h 00m with clients + 38m travel', miles: 10, pay: 30.2, status: 'Confirmed', rows: [
      { title: 'Doris Finch · Morning', sub: '08:00–08:45 · 45m · 2 mi', pay: 10.6, status: 'Confirmed' },
      { title: 'Mary Adams · Lunch', sub: '12:45–13:30 · 45m · 3 mi', pay: 11.4, status: 'Confirmed' },
      { title: 'George Bell · Tea', sub: '16:45–17:15 · 30m · 2 mi', pay: 8.2, status: 'Confirmed' },
    ] },
  ],
  week: [
    { label: 'This week · 29 Jun – 5 Jul', hours: '31h 20m', miles: 42, pay: 372.4, status: 'Pending', rows: [
      { title: 'Mon 29 Jun', sub: '4 visits · 9 mi · 3h 25m', pay: 78.4, status: 'Confirmed' },
      { title: 'Tue 30 Jun', sub: '6 visits · 14 mi · 4h 18m', pay: 92.6, status: 'Pending' },
      { title: 'Wed 1 Jul', sub: '5 visits · 8 mi · 3h 40m', pay: 76.5, status: 'Pending' },
      { title: 'Thu 2 Jul', sub: '4 visits · 6 mi · 3h 05m', pay: 68.1, status: 'Pending' },
      { title: 'Fri 3 Jul', sub: '3 visits · 5 mi · 2h 40m', pay: 56.8, status: 'Pending' },
    ] },
    { label: 'Last week · 22 – 28 Jun', hours: '34h 10m', miles: 48, pay: 410.2, status: 'Confirmed', rows: [
      { title: 'Mon 22 Jun', sub: '5 visits · 10 mi · 3h 50m', pay: 82.6, status: 'Confirmed' },
      { title: 'Tue 23 Jun', sub: '5 visits · 9 mi · 3h 45m', pay: 88.4, status: 'Confirmed' },
      { title: 'Wed 24 Jun', sub: '4 visits · 7 mi · 3h 00m', pay: 66.3, status: 'Confirmed' },
      { title: 'Fri 26 Jun', sub: '3 visits · 10 mi · 2h 38m', pay: 78.1, status: 'Confirmed' },
      { title: 'Sat 27 Jun', sub: '4 visits · 12 mi · 3h 24m', pay: 94.8, status: 'Confirmed' },
    ] },
    { label: '2 weeks ago · 15 – 21 Jun', hours: '33h 05m', miles: 44, pay: 396.5, status: 'Confirmed', rows: [
      { title: 'Mon 15 Jun', sub: '5 visits · 9 mi · 3h 40m', pay: 80.2, status: 'Confirmed' },
      { title: 'Wed 17 Jun', sub: '5 visits · 8 mi · 3h 55m', pay: 84.6, status: 'Confirmed' },
      { title: 'Thu 18 Jun', sub: '4 visits · 7 mi · 3h 00m', pay: 66.4, status: 'Confirmed' },
      { title: 'Sat 20 Jun', sub: '5 visits · 11 mi · 3h 30m', pay: 84.3, status: 'Confirmed' },
      { title: 'Sun 21 Jun', sub: '4 visits · 9 mi · 3h 20m', pay: 81.0, status: 'Confirmed' },
    ] },
  ],
  month: [
    { label: 'July 2026 (to date)', hours: '132h 45m', miles: 176, pay: 1632.0, status: 'Pending', rows: [
      { title: 'Week 1 · 1–7 Jul', sub: '24 visits · 42 mi', pay: 372.4, status: 'Confirmed' },
      { title: 'Week 2 · 8–14 Jul', sub: '26 visits · 48 mi', pay: 418.9, status: 'Confirmed' },
      { title: 'Week 3 · 15–21 Jul', sub: '25 visits · 44 mi', pay: 401.2, status: 'Confirmed' },
      { title: 'Week 4 · 22–28 Jul', sub: '21 visits · 42 mi', pay: 439.5, status: 'Pending' },
    ] },
    { label: 'June 2026', hours: '146h 00m', miles: 172, pay: 1758.2, status: 'Confirmed', rows: [
      { title: 'Week 1 · 1–7 Jun', sub: '27 visits · 44 mi', pay: 438.6, status: 'Confirmed' },
      { title: 'Week 2 · 8–14 Jun', sub: '26 visits · 42 mi', pay: 452.1, status: 'Confirmed' },
      { title: 'Week 3 · 15–21 Jun', sub: '25 visits · 44 mi', pay: 396.5, status: 'Confirmed' },
      { title: 'Week 4 · 22–28 Jun', sub: '28 visits · 42 mi', pay: 471.0, status: 'Confirmed' },
    ] },
    { label: 'May 2026', hours: '155h 30m', miles: 188, pay: 1866.0, status: 'Confirmed', rows: [
      { title: 'Week 1 · 1–7 May', sub: '29 visits · 48 mi', pay: 462.4, status: 'Confirmed' },
      { title: 'Week 2 · 8–14 May', sub: '28 visits · 46 mi', pay: 470.1, status: 'Confirmed' },
      { title: 'Week 3 · 15–21 May', sub: '27 visits · 45 mi', pay: 458.5, status: 'Confirmed' },
      { title: 'Week 4 · 22–28 May', sub: '28 visits · 49 mi', pay: 475.0, status: 'Confirmed' },
    ] },
  ],
}

export const gbp = (n) => '£' + Number(n).toFixed(2)
