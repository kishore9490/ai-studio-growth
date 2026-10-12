import type { PartId } from './Extinguisher'

/**
 * Camera storyboard for the hero.
 *
 *  A  Establishing — wide, high, the extinguisher is one object in a large dark bay.
 *  B  Product hero — low three-quarter, product fills the right half of the frame.
 *  C  Detail      — close on the valve head: gauge, pull pin, lever, hose outlet.
 *  D  Full reveal — pull back and around to show the whole unit in its environment.
 *
 * The intro timeline (time-based) moves A → B by tweening `intro.p` 0 → 1.
 * The scroll timeline (ScrollTrigger scrub) tweens `scroll` from B → C → D.
 * Final pose = lerp(A, B, intro.p) + (scroll − B): the two never write the same
 * property, so they cannot conflict, and reverse scrolling is exact.
 */

export type Pose = {
  px: number
  py: number
  pz: number
  tx: number
  ty: number
  tz: number
  fov: number
  /** Lens shift as a fraction of viewport width/height (+x moves subject right, +y moves subject down). */
  sx: number
  sy: number
  /** Product yaw (radians). */
  rot: number
  /** Light levels (multipliers). */
  rim: number
  key: number
  room: number
}

export type PoseSet = { A: Pose; B: Pose; C: Pose; D: Pose }

const base: Pose = { px: 0, py: 0, pz: 0, tx: 0, ty: 0, tz: 0, fov: 30, sx: 0, sy: 0, rot: 0, rim: 1, key: 1, room: 1 }
const p = (o: Partial<Pose>): Pose => ({ ...base, ...o })

/** Landscape: copy on the left, product on the right. */
export const WIDE: PoseSet = {
  A: p({ px: 3.4, py: 2.3, pz: 6.2, tx: -0.2, ty: 1.0, tz: -3, fov: 38, sx: 0.08, rot: -0.5, rim: 0.2, key: 0.35, room: 0.55 }),
  B: p({ px: 1.05, py: 0.36, pz: 1.32, tx: 0.0, ty: 0.31, tz: 0, fov: 30, sx: 0.17, rot: 0.22 }),
  C: p({ px: 0.27, py: 0.6, pz: 0.36, tx: -0.005, ty: 0.545, tz: 0.01, fov: 30, sx: 0.12, sy: 0.02, rot: 0.18, rim: 1.25, key: 0.95 }),
  D: p({ px: -1.55, py: 0.62, pz: 2.25, tx: 0.05, ty: 0.42, tz: -0.4, fov: 34, sx: -0.16, rot: -0.75, rim: 1.4, key: 0.85, room: 1.1 }),
}

/** Portrait / narrow: headline on top, product centred lower, CTAs at the bottom. */
export const NARROW: PoseSet = {
  A: p({ px: 2.8, py: 2.2, pz: 6.8, tx: 0, ty: 0.9, tz: -2.5, fov: 48, sy: 0.08, rot: -0.5, rim: 0.2, key: 0.35, room: 0.55 }),
  B: p({ px: 1.0, py: 0.42, pz: 1.38, tx: 0.0, ty: 0.33, tz: 0, fov: 50, sy: -0.015, rot: 0.22 }),
  C: p({ px: 0.3, py: 0.62, pz: 0.42, tx: -0.005, ty: 0.54, tz: 0.01, fov: 46, sy: 0.02, rot: 0.18, rim: 1.25, key: 0.95 }),
  D: p({ px: -1.3, py: 0.7, pz: 2.3, tx: 0.03, ty: 0.38, tz: -0.4, fov: 48, sy: -0.04, rot: -0.75, rim: 1.4, key: 0.85, room: 1.1 }),
}

/** Leader-line directions (dx, dy ∈ {-1, 0, 1}) per layout, chosen so labels never cross the caption or each other. */
export const HERO_ANNOTATIONS: { id: PartId; title: string; note: string; wide: [number, number]; narrow: [number, number] }[] = [
  { id: 'lever', title: 'Operating lever', note: 'Squeeze-grip discharge control', wide: [-1, 1], narrow: [0, -1] },
  { id: 'pin', title: 'Safety pin & tamper seal', note: 'Shows the unit has not been operated', wide: [-1, 1], narrow: [-1, 1] },
  { id: 'gauge', title: 'Pressure gauge', note: 'Read at every inspection', wide: [1, 1], narrow: [1, 1] },
  { id: 'valve', title: 'Valve head & hose outlet', note: 'Checked for corrosion and blockage', wide: [1, -1], narrow: [1, -1] },
]

export type HeroBus = {
  poses: PoseSet
  intro: { p: number }
  scroll: Pose
  reducedMotion: boolean
  /** Set by the scene once the first frame has rendered. */
  ready: boolean
  onReady?: () => void
  /** DOM nodes the render loop positions over projected 3D anchors. */
  annotationEls: Partial<Record<PartId, HTMLElement | null>>
}

export function createHeroBus(): HeroBus {
  return {
    poses: WIDE,
    intro: { p: 0 },
    scroll: { ...WIDE.B },
    reducedMotion: false,
    ready: false,
    annotationEls: {},
  }
}

export const POSE_KEYS: (keyof Pose)[] = ['px', 'py', 'pz', 'tx', 'ty', 'tz', 'fov', 'sx', 'sy', 'rot', 'rim', 'key', 'room']

export function composePose(bus: HeroBus, out: Pose): Pose {
  const { A, B } = bus.poses
  const t = bus.intro.p
  for (const k of POSE_KEYS) {
    out[k] = A[k] + (B[k] - A[k]) * t + (bus.scroll[k] - B[k])
  }
  return out
}
