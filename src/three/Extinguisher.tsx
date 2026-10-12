import { forwardRef, useMemo, useRef } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { gaugeTexture, labelTexture, paintRoughness } from './textures'

/**
 * Procedurally modelled stored-pressure ABC dry powder extinguisher.
 * Units are metres; the origin sits on the floor at the cylinder's axis.
 * Front (label, gauge, pull ring) faces +Z. The discharge hose leaves on +X,
 * the carrying handle and operating lever extend toward -X.
 * Overall height ≈ 0.61 m, shell diameter 0.16 m (typical 6 kg portable unit).
 */

export type PartId = 'gauge' | 'pin' | 'lever' | 'hose' | 'body' | 'valve'

/** Anchor points in model space used for annotations and hotspots. */
export const ANCHORS: Record<PartId, THREE.Vector3Tuple> = {
  gauge: [0, 0.536, 0.05],
  pin: [-0.022, 0.548, 0.036],
  lever: [-0.1, 0.596, 0.0],
  hose: [0.104, 0.36, 0.03],
  body: [0.0, 0.26, 0.082],
  valve: [0.03, 0.52, 0.0],
}

/** Outward normals for each anchor, used to hide hotspots that face away from the camera. */
export const ANCHOR_NORMALS: Record<PartId, THREE.Vector3Tuple> = {
  gauge: [0, 0, 1],
  pin: [0, 0, 1],
  lever: [-0.6, 0.8, 0],
  hose: [0.9, 0, 0.4],
  body: [0, 0, 1],
  valve: [0.6, 0.2, 0.6],
}

type Props = {
  highlight?: PartId | null
  quality?: 'high' | 'low'
} & Omit<ThreeElements['group'], 'ref'>

const SHELL_R = 0.08

function shellProfile() {
  const pts: THREE.Vector2[] = []
  pts.push(new THREE.Vector2(0.0, 0.02))
  pts.push(new THREE.Vector2(0.05, 0.02))
  pts.push(new THREE.Vector2(0.068, 0.023))
  pts.push(new THREE.Vector2(0.076, 0.03))
  pts.push(new THREE.Vector2(0.0795, 0.04))
  pts.push(new THREE.Vector2(SHELL_R, 0.05))
  pts.push(new THREE.Vector2(SHELL_R, 0.398))
  // elliptical shoulder (deep drawn dome)
  for (let i = 1; i <= 14; i++) {
    const t = (i / 14) * (Math.PI / 2)
    pts.push(new THREE.Vector2(0.027 + (SHELL_R - 0.027) * Math.cos(t), 0.398 + 0.072 * Math.sin(t)))
  }
  pts.push(new THREE.Vector2(0.026, 0.478))
  pts.push(new THREE.Vector2(0.0, 0.478))
  return pts
}

/** Side profile of the operating lever / carrying handle, extruded across Z. */
function leverShape(len: number, rootH: number, tipH: number, droop: number) {
  const s = new THREE.Shape()
  s.moveTo(0, -rootH / 2)
  s.bezierCurveTo(-len * 0.35, -rootH / 2 - droop * 0.2, -len * 0.75, -tipH / 2 - droop * 0.8, -len, -tipH / 2 - droop)
  s.quadraticCurveTo(-len - tipH * 0.9, -droop, -len, tipH / 2 - droop)
  s.bezierCurveTo(-len * 0.75, tipH / 2 - droop * 0.8, -len * 0.35, rootH / 2 - droop * 0.2, 0, rootH / 2)
  s.closePath()
  return s
}

export const Extinguisher = forwardRef<THREE.Group, Props>(function Extinguisher(
  { highlight = null, quality = 'high', ...rest },
  ref,
) {
  const seg = quality === 'high' ? 96 : 48

  const tex = useMemo(
    () => ({
      rough: paintRoughness(quality === 'high' ? 512 : 256),
      label: labelTexture(),
      gauge: gaugeTexture(),
    }),
    [quality],
  )

  const geo = useMemo(() => {
    const shell = new THREE.LatheGeometry(shellProfile(), seg)
    const lever = new THREE.ExtrudeGeometry(leverShape(0.14, 0.014, 0.01, -0.022), {
      depth: 0.02,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0018,
      bevelSegments: 3,
      curveSegments: 24,
    })
    lever.translate(0, 0, -0.01)
    const handle = new THREE.ExtrudeGeometry(leverShape(0.135, 0.016, 0.012, 0.012), {
      depth: 0.024,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.002,
      bevelSegments: 3,
      curveSegments: 24,
    })
    handle.translate(0, 0, -0.012)

    const hoseCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.066, 0.53, 0.0),
        new THREE.Vector3(0.088, 0.53, 0.004),
        new THREE.Vector3(0.108, 0.508, 0.012),
        new THREE.Vector3(0.117, 0.45, 0.02),
        new THREE.Vector3(0.114, 0.36, 0.03),
        new THREE.Vector3(0.104, 0.27, 0.04),
        new THREE.Vector3(0.095, 0.205, 0.046),
      ],
      false,
      'centripetal',
    )
    const hose = new THREE.TubeGeometry(hoseCurve, quality === 'high' ? 96 : 48, 0.0088, quality === 'high' ? 16 : 10, false)
    const end = hoseCurve.getPoint(1)
    const dir = hoseCurve.getTangent(1).normalize()
    return { shell, lever, handle, hose, hoseEnd: end, hoseDir: dir }
  }, [seg, quality])

  // One material instance per part so a single component can be highlighted.
  const mats = useMemo(() => {
    const paint = () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#b8131c'),
        roughness: 0.42,
        roughnessMap: tex.rough,
        metalness: 0.0,
        clearcoat: 1,
        clearcoatRoughness: 0.09,
        sheen: 0.0,
        emissive: new THREE.Color('#ff3b2f'),
        emissiveIntensity: 0,
      })
    const chrome = () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#c9cdd2'),
        metalness: 1,
        roughness: 0.16,
        clearcoat: 0.3,
        emissive: new THREE.Color('#ff3b2f'),
        emissiveIntensity: 0,
      })
    const rubber = () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#121416'),
        roughness: 0.62,
        metalness: 0,
        emissive: new THREE.Color('#ff3b2f'),
        emissiveIntensity: 0,
      })
    return {
      body: {
        shell: paint(),
        label: new THREE.MeshPhysicalMaterial({
          map: tex.label,
          roughness: 0.48,
          clearcoat: 0.6,
          clearcoatRoughness: 0.2,
          emissive: new THREE.Color('#ff3b2f'),
          emissiveIntensity: 0,
        }),
        foot: new THREE.MeshStandardMaterial({ color: '#0d0f11', roughness: 0.78 }),
      },
      valve: { metal: chrome(), brass: new THREE.MeshPhysicalMaterial({ color: '#b79a5c', metalness: 1, roughness: 0.28, emissive: new THREE.Color('#ff3b2f'), emissiveIntensity: 0 }) },
      lever: { metal: chrome(), grip: rubber() },
      pin: {
        metal: chrome(),
        seal: new THREE.MeshStandardMaterial({ color: '#c7f36b', roughness: 0.5, emissive: new THREE.Color('#c7f36b'), emissiveIntensity: 0.05 }),
      },
      gauge: {
        metal: chrome(),
        face: new THREE.MeshStandardMaterial({ map: tex.gauge, roughness: 0.4, emissive: new THREE.Color('#ff3b2f'), emissiveIntensity: 0 }),
        glass: new THREE.MeshPhysicalMaterial({
          color: '#ffffff',
          roughness: 0.02,
          metalness: 0,
          transparent: true,
          opacity: 0.18,
          clearcoat: 1,
          clearcoatRoughness: 0.02,
        }),
      },
      hose: { rubber: rubber(), metal: chrome() },
    }
  }, [tex])

  // Smoothly animate emissive highlight on the selected component.
  const levels = useRef<Record<PartId, number>>({ gauge: 0, pin: 0, lever: 0, hose: 0, body: 0, valve: 0 })
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    ;(Object.keys(levels.current) as PartId[]).forEach((id) => {
      const target = highlight === id ? 0.35 + Math.sin(t * 3.2) * 0.12 : 0
      levels.current[id] = THREE.MathUtils.damp(levels.current[id], target, 8, dt)
      const group = (mats as Record<string, Record<string, THREE.Material>>)[id]
      if (!group) return
      Object.values(group).forEach((m) => {
        if ('emissiveIntensity' in m && m !== mats.pin.seal) {
          ;(m as THREE.MeshStandardMaterial).emissiveIntensity = levels.current[id]
        }
      })
    })
  })

  const nozzleQuat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), geo.hoseDir),
    [geo.hoseDir],
  )

  return (
    <group ref={ref} {...rest}>
      {/* ——— Shell ——— */}
      <mesh geometry={geo.shell} material={mats.body.shell} castShadow receiveShadow />
      {/* circumferential weld seam */}
      <mesh position={[0, 0.398, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.body.shell}>
        <torusGeometry args={[SHELL_R + 0.0003, 0.0013, 8, seg]} />
      </mesh>
      {/* instruction label wraps ~126° around the front */}
      <mesh position={[0, 0.245, 0]} material={mats.body.label}>
        <cylinderGeometry args={[SHELL_R + 0.0006, SHELL_R + 0.0006, 0.2, seg, 1, true, -1.1, 2.2]} />
      </mesh>
      {/* moulded foot ring */}
      <mesh position={[0, 0.018, 0]} material={mats.body.foot} castShadow>
        <cylinderGeometry args={[0.0812, 0.0828, 0.036, seg, 1, true]} />
      </mesh>
      <mesh position={[0, 0.036, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.body.foot}>
        <torusGeometry args={[0.0815, 0.0018, 8, seg]} />
      </mesh>

      {/* ——— Valve head ——— */}
      <group>
        {/* knurled neck collar */}
        <mesh position={[0, 0.486, 0]} material={mats.valve.brass}>
          <cylinderGeometry args={[0.03, 0.031, 0.018, 36]} />
        </mesh>
        <mesh position={[0, 0.486, 0]} material={mats.valve.brass}>
          <cylinderGeometry args={[0.0318, 0.0318, 0.012, 18]} />
        </mesh>
        {/* forged valve body */}
        <mesh position={[0, 0.528, 0]} material={mats.valve.metal}>
          <cylinderGeometry args={[0.019, 0.023, 0.05, 32]} />
        </mesh>
        <mesh position={[0.004, 0.556, 0]} material={mats.valve.metal}>
          <boxGeometry args={[0.05, 0.016, 0.028]} />
        </mesh>
        {/* discharge outlet boss + crimped hose ferrule */}
        <mesh position={[0.032, 0.53, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.valve.metal}>
          <cylinderGeometry args={[0.0105, 0.0125, 0.03, 24]} />
        </mesh>
        <mesh position={[0.056, 0.53, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.hose.metal}>
          <cylinderGeometry args={[0.0122, 0.0122, 0.022, 24]} />
        </mesh>
        {[0.05, 0.056, 0.062].map((x) => (
          <mesh key={x} position={[x, 0.53, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.hose.metal}>
            <torusGeometry args={[0.0124, 0.0009, 6, 24]} />
          </mesh>
        ))}
        {/* valve stem cap */}
        <mesh position={[0.012, 0.567, 0]} material={mats.valve.metal}>
          <cylinderGeometry args={[0.006, 0.007, 0.008, 16]} />
        </mesh>
      </group>

      {/* ——— Gauge on the front boss ——— */}
      <group position={[0, 0.536, 0]}>
        <mesh position={[0, 0, 0.026]} rotation={[Math.PI / 2, 0, 0]} material={mats.gauge.metal}>
          <cylinderGeometry args={[0.0065, 0.0075, 0.02, 16]} />
        </mesh>
        <group position={[0, 0, 0.044]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.gauge.metal}>
            <cylinderGeometry args={[0.0215, 0.0215, 0.011, 40]} />
          </mesh>
          <mesh position={[0, 0, 0.0057]} material={mats.gauge.face}>
            <circleGeometry args={[0.0188, 40]} />
          </mesh>
          <mesh position={[0, 0, 0.0058]} material={mats.gauge.metal}>
            <torusGeometry args={[0.0198, 0.0022, 10, 40]} />
          </mesh>
          <mesh position={[0, 0, 0.0068]} material={mats.gauge.glass}>
            <circleGeometry args={[0.0192, 40]} />
          </mesh>
        </group>
      </group>

      {/* ——— Carrying handle (fixed) and operating lever ——— */}
      <group>
        <mesh geometry={geo.handle} position={[0.006, 0.546, 0]} material={mats.lever.metal} castShadow />
        <mesh geometry={geo.lever} position={[0.014, 0.578, 0]} rotation={[0, 0, -0.06]} material={mats.lever.metal} castShadow />
        {/* rubber grip sleeve on the handle */}
        <mesh position={[-0.098, 0.553, 0]} rotation={[0, 0, Math.PI / 2 + 0.08]} material={mats.lever.grip}>
          <capsuleGeometry args={[0.0105, 0.05, 6, 16]} />
        </mesh>
        {/* pivot pin */}
        <mesh position={[0.016, 0.572, 0]} rotation={[Math.PI / 2, 0, 0]} material={mats.lever.metal}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.034, 12]} />
        </mesh>
      </group>

      {/* ——— Safety pin, pull ring and tamper seal ——— */}
      <group position={[-0.022, 0.562, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={mats.pin.metal}>
          <cylinderGeometry args={[0.0019, 0.0019, 0.05, 10]} />
        </mesh>
        <mesh position={[0, -0.012, 0.026]} rotation={[0, 0, 0.12]} material={mats.pin.metal}>
          <torusGeometry args={[0.0118, 0.0017, 10, 36]} />
        </mesh>
        <mesh position={[0.004, -0.024, 0.018]} rotation={[0.9, 0.3, 0]} material={mats.pin.seal}>
          <torusGeometry args={[0.0055, 0.0011, 6, 20]} />
        </mesh>
      </group>

      {/* ——— Discharge hose, nozzle and retaining clip ——— */}
      <mesh geometry={geo.hose} material={mats.hose.rubber} castShadow />
      <group position={geo.hoseEnd} quaternion={nozzleQuat}>
        {/* nozzle body hangs along the hose tangent */}
        <mesh position={[0, 0.006, 0]} material={mats.hose.metal}>
          <cylinderGeometry args={[0.0105, 0.0105, 0.012, 20]} />
        </mesh>
        <mesh position={[0, 0.034, 0]} material={mats.hose.rubber}>
          <cylinderGeometry args={[0.0085, 0.0112, 0.046, 20]} />
        </mesh>
        <mesh position={[0, 0.06, 0]} material={mats.hose.metal}>
          <cylinderGeometry args={[0.0062, 0.0082, 0.008, 20]} />
        </mesh>
      </group>
      <mesh position={[0.084, 0.188, 0.04]} rotation={[0, Math.atan2(0.04, 0.084) - Math.PI / 2, 0]} material={mats.hose.metal}>
        <boxGeometry args={[0.03, 0.012, 0.006]} />
      </mesh>
    </group>
  )
})
