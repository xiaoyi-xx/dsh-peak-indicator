/**
 * Boundary tests for the peak/off-peak algorithm.
 *
 * NOTE: this file mirrors the `compute` function in src/client.js — keep the
 * two in sync when editing BOUNDS or the window logic there.
 */
const BOUNDS = [540, 720, 840, 1080] // 09:00, 12:00, 14:00, 18:00 (minutes)

function compute(h, m, s) {
  const now = h * 60 + m
  const peak = (now >= BOUNDS[0] && now < BOUNDS[1]) || (now >= BOUNDS[2] && now < BOUNDS[3])
  let next = null
  for (let i = 0; i < BOUNDS.length; i++) {
    if (BOUNDS[i] > now) { next = { min: BOUNDS[i], tomorrow: false }; break }
  }
  if (next === null) next = { min: BOUNDS[0], tomorrow: true }
  const secsToNext = (next.min - now) * 60 - s + (next.tomorrow ? 24 * 3600 : 0)
  let phaseStart = 0
  for (let j = BOUNDS.length - 1; j >= 0; j--) {
    if (BOUNDS[j] <= now) { phaseStart = BOUNDS[j]; break }
  }
  const phaseLenMin = (next.min - now) + (next.tomorrow ? 1440 : 0) + (now - phaseStart)
  const progress = phaseLenMin > 0 ? Math.min(100, Math.max(0, ((now - phaseStart) / phaseLenMin) * 100)) : 0
  return { peak, nextMin: next.min, tomorrow: next.tomorrow, secsToNext, progress }
}

const cases = [
  { label: '10:00 in morning peak', h: 10, m: 0, s: 0, peak: true, nextMin: 720, tomorrow: false },
  { label: '12:30 off-peak before 14:00', h: 12, m: 30, s: 0, peak: false, nextMin: 840, tomorrow: false },
  { label: '15:00 in afternoon peak', h: 15, m: 0, s: 0, peak: true, nextMin: 1080, tomorrow: false },
  { label: '19:00 off-peak, next peak tomorrow', h: 19, m: 0, s: 0, peak: false, nextMin: 540, tomorrow: true },
  { label: '08:00 off-peak before 09:00', h: 8, m: 0, s: 0, peak: false, nextMin: 540, tomorrow: false },
  { label: '09:00 exact — peak begins', h: 9, m: 0, s: 0, peak: true, nextMin: 720, tomorrow: false },
  { label: '18:00 exact — peak ends', h: 18, m: 0, s: 0, peak: false, nextMin: 540, tomorrow: true },
  { label: '13:59:59 just before 14:00', h: 13, m: 59, s: 59, peak: false, nextMin: 840, tomorrow: false },
]

let failed = 0
for (const c of cases) {
  const r = compute(c.h, c.m, c.s)
  const ok = r.peak === c.peak && r.nextMin === c.nextMin && r.tomorrow === c.tomorrow
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.label.padEnd(34)} peak=${String(r.peak).padEnd(5)} next=${Math.floor(r.nextMin / 60)}:${String(r.nextMin % 60).padStart(2, '0')}${r.tomorrow ? '(tmrw)' : ''} in=${Math.round(r.secsToNext / 60)}m`)
  if (!ok) failed++
}
if (failed > 0) {
  console.error(`${failed} case(s) failed`)
  process.exit(1)
}
console.log(`all ${cases.length} cases passed`)
