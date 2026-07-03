/** Body-map posture hotspots + snap-to-body-part, pulled from careflow-platform
 *  (care-admin/src/features/service-users/body-map/catalog/body-map-posture-hotspots.ts).
 *
 *  Coordinates are % of the SVG viewBox (0–100). On tap, the nearest hotspot within
 *  (radius + SNAP) auto-labels the marker with its body part. Distances scale x by the
 *  view's aspect ratio so the hit is round on screen (careflow's approach).
 *
 *  Sitting + Lying (= careflow "leaning") are the pressure-care diagrams and carry
 *  exact catalogs. Standing is the general anatomical figure (regions, not fixed
 *  pressure points) — free placement, assisted by the body-part datalist below.
 */

/** Sitting — from SITTING_POSTURE_HOTSPOTS (sitting.svg cls-7 markers). */
export const SITTING_HOTSPOTS = [
  { part: 'Middle of spine', x: 41.4, y: 39.2, r: 7 },
  { part: 'Buttocks', x: 41.8, y: 52.6, r: 7 },
  { part: 'Base of spine', x: 42.6, y: 59.0, r: 7 },
  { part: 'Back of knees', x: 62.1, y: 59.5, r: 7 },
  { part: 'Balls of feet', x: 63.6, y: 82.3, r: 6 },
  { part: 'Heels', x: 70.5, y: 82.4, r: 6 },
]

/** Lying — from LEANING_POSTURE_HOTSPOTS (leaning.svg #ff0087 markers), banded by
 *  posture: on back (top figure), on side (middle), on front (bottom). */
export const LYING_HOTSPOTS = [
  { part: 'Back of the head', x: 12.8, y: 15.4, r: 6, band: 'on_back' },
  { part: 'Shoulder', x: 27.3, y: 15.4, r: 6, band: 'on_back' },
  { part: 'Elbow', x: 37.0, y: 15.4, r: 6, band: 'on_back' },
  { part: 'Buttocks', x: 45.9, y: 15.4, r: 6, band: 'on_back' },
  { part: 'Heel', x: 83.4, y: 15.4, r: 6, band: 'on_back' },
  { part: 'Ear', x: 14.7, y: 48.0, r: 7, band: 'on_side' },
  { part: 'Shoulder', x: 21.9, y: 49.8, r: 7, band: 'on_side' },
  { part: 'Elbow', x: 26.1, y: 53.6, r: 7, band: 'on_side' },
  { part: 'Hip', x: 44.5, y: 54.0, r: 7, band: 'on_side' },
  { part: 'Thigh', x: 55.9, y: 53.6, r: 7, band: 'on_side' },
  { part: 'Inner side of the knee', x: 65.9, y: 47.5, r: 7, band: 'on_side' },
  { part: 'Leg', x: 73.5, y: 52.4, r: 7, band: 'on_side' },
  { part: 'Heel', x: 86.0, y: 53.6, r: 6, band: 'on_side' },
  { part: 'Elbow', x: 17.1, y: 79.3, r: 6, band: 'on_front' },
  { part: 'Rib cage', x: 33.6, y: 79.3, r: 6, band: 'on_front' },
  { part: 'Thigh', x: 51.0, y: 79.3, r: 6, band: 'on_front' },
  { part: 'Knees', x: 65.2, y: 79.3, r: 6, band: 'on_front' },
  { part: 'Toes', x: 89.9, y: 79.3, r: 6, band: 'on_front' },
]

const HOTSPOTS = { sitting: SITTING_HOTSPOTS, lying: LYING_HOTSPOTS, standing: [] }
const ASPECT = { standing: 798.03553 / 815.24999, sitting: 374.625 / 270, lying: 375 / 416.875 }
const SNAP = 6 // extra snap-assist radius (careflow POSTURE_HOTSPOT_SNAP_RADIUS)

/** Which leaning band a click falls in (careflow leaningDiagramBandForY). */
function leaningBand(y) {
  return y < 34 ? 'on_back' : y < 60 ? 'on_side' : 'on_front'
}

/** Nearest body part to a tap at (x%, y%) on a posture view, or '' if none is close. */
export function snapBodyPart(view, x, y) {
  let spots = HOTSPOTS[view] || []
  if (view === 'lying') { const band = leaningBand(y); spots = spots.filter((s) => !s.band || s.band === band) }
  const aspect = ASPECT[view] || 1
  let best = null
  let bestDist = Infinity
  for (const s of spots) {
    const dx = (x - s.x) * aspect
    const dy = y - s.y
    const dist = Math.hypot(dx, dy)
    const threshold = (s.r || 7) + SNAP
    if (dist <= threshold && dist < bestDist) { best = s; bestDist = dist }
  }
  return best ? best.part : ''
}

/** Datalist suggestions for the marker note — covers all postures. */
export const BODY_PART_SUGGESTIONS = [
  'Head', 'Back of the head', 'Ear', 'Face', 'Shoulder', 'Shoulder blade', 'Elbow', 'Wrist', 'Hand',
  'Chest', 'Rib cage', 'Abdomen', 'Spine', 'Middle of spine', 'Base of spine', 'Sacrum', 'Buttocks',
  'Hip', 'Thigh', 'Knee', 'Back of knees', 'Inner side of the knee', 'Shin', 'Leg', 'Ankle',
  'Heel', 'Heels', 'Balls of feet', 'Toes', 'Foot',
]
