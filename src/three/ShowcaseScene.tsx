import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { ANCHOR_NORMALS, ANCHORS, Extinguisher, type PartId } from './Extinguisher'
import { EnvBinder } from './HeroScene'

export type ShowcaseBus = {
  selected: PartId | null
  /** User drag offset (radians), applied on top of the selection yaw. */
  drag: number
  reducedMotion: boolean
  markerEls: Partial<Record<PartId, HTMLElement | null>>
  onReady?: () => void
}

const CAM = new THREE.Vector3(0.82, 0.46, 1.2)
const LOOK = new THREE.Vector3(0, 0.3, 0)
const CAM_ANGLE = Math.atan2(CAM.x, CAM.z)
const BASE_YAW = 0.25

function partYaw(id: PartId) {
  const [nx, , nz] = ANCHOR_NORMALS[id]
  return CAM_ANGLE - Math.atan2(nx, nz)
}

function Director({ bus, product }: { bus: ShowcaseBus; product: React.RefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const yaw = useRef(BASE_YAW)
  const camPos = useMemo(() => CAM.clone(), [])
  const look = useMemo(() => LOOK.clone(), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const n = useMemo(() => new THREE.Vector3(), [])
  const toCam = useMemo(() => new THREE.Vector3(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const frames = useRef(0)

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.1)
    const sel = bus.selected
    const lambda = bus.reducedMotion ? 1000 : 4.5

    // Product yaw: face the selected part toward camera, plus the user's drag offset.
    let target = (sel ? partYaw(sel) : BASE_YAW) + bus.drag
    // take the shortest way round
    while (target - yaw.current > Math.PI) target -= Math.PI * 2
    while (target - yaw.current < -Math.PI) target += Math.PI * 2
    yaw.current = THREE.MathUtils.damp(yaw.current, target, lambda, d)
    if (product.current) product.current.rotation.y = yaw.current

    // Camera: dolly toward the part's height when one is selected.
    const anchorY = sel ? ANCHORS[sel][1] : LOOK.y
    const zoom = sel ? 0.58 : 1
    v.copy(CAM).sub(LOOK).multiplyScalar(zoom)
    v.y += (anchorY - LOOK.y) * 0.4
    v.add(new THREE.Vector3(0, anchorY, 0))
    camPos.x = THREE.MathUtils.damp(camPos.x, v.x, lambda, d)
    camPos.y = THREE.MathUtils.damp(camPos.y, v.y, lambda, d)
    camPos.z = THREE.MathUtils.damp(camPos.z, v.z, lambda, d)
    look.y = THREE.MathUtils.damp(look.y, anchorY, lambda, d)
    camera.position.copy(camPos)
    camera.lookAt(look)

    // Project hotspot markers; hide those on the far side of the product.
    if (product.current) {
      product.current.updateWorldMatrix(true, false)
      product.current.getWorldQuaternion(q)
      const { width, height } = state.size
      for (const id of Object.keys(bus.markerEls) as PartId[]) {
        const el = bus.markerEls[id]
        if (!el) continue
        v.set(...ANCHORS[id])
        product.current.localToWorld(v)
        n.set(...ANCHOR_NORMALS[id]).normalize().applyQuaternion(q)
        toCam.copy(camera.position).sub(v).normalize()
        const facing = n.dot(toCam) > 0.15
        v.project(camera)
        const x = (v.x * 0.5 + 0.5) * width
        const y = (-v.y * 0.5 + 0.5) * height
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        el.style.visibility = facing ? 'visible' : 'hidden'
      }
    }

    frames.current++
    if (frames.current === 3) bus.onReady?.()
  })
  return null
}

export default function ShowcaseScene({ bus, active, quality, selected }: { bus: ShowcaseBus; active: boolean; quality: 'high' | 'low'; selected: PartId | null }) {
  const product = useRef<THREE.Group>(null)
  const envScene = useMemo(() => new THREE.Scene(), [])
  const target = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 0.3, 0)
    return o
  }, [])
  return (
    <Canvas
      dpr={[1, quality === 'high' ? 1.75 : 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: false }}
      camera={{ fov: 28, near: 0.02, far: 30, position: CAM.toArray() }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.setClearAlpha(0)
        scene.background = new THREE.Color('#12161c')
        scene.fog = new THREE.Fog('#12161c', 3, 9)
      }}
      aria-hidden="true"
    >
      <primitive object={target} />
      <spotLight position={[-1.6, 2.6, 2]} angle={0.45} penumbra={1} intensity={22} decay={2} color="#fff3e8" target={target} />
      <spotLight position={[0.9, 1.5, -1.5]} angle={0.3} penumbra={0.7} decay={1.5} distance={2.6} intensity={36} color="#ff3b2f" target={target} />
      <spotLight position={[-1.1, 1.3, -1.3]} angle={0.3} penumbra={1} decay={1.5} distance={2.3} intensity={6} color="#b8d4ff" target={target} />
      <pointLight position={[0.35, 0.95, 0.65]} intensity={0.9} distance={2.2} decay={2} />
      <hemisphereLight args={['#6b7581', '#0b0e12', 0.6]} />

      {/* studio sweep */}
      <mesh position={[0, 0, -1.6]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[3, 3, 6, 64, 1, true, Math.PI * 0.75, Math.PI * 0.5]} />
        <meshStandardMaterial color="#171c23" roughness={0.9} side={THREE.BackSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial color="#141920" roughness={0.75} metalness={0.2} />
      </mesh>

      <Environment scene={envScene} resolution={128} frames={1}>
        <color attach="background" args={['#050608']} />
        {[-3, 0, 3].map((z) => (
          <Lightformer key={z} form="rect" intensity={1.6} rotation-x={Math.PI / 2} position={[0, 5, z]} scale={[0.6, 8, 1]} />
        ))}
        <Lightformer form="rect" intensity={1.1} rotation-x={Math.PI / 2} position={[0, 4, 0]} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#d9e2ec" position={[2, 0.8, 5]} scale={[6, 2, 1]} target={[0, 0.4, 0]} />
        <Lightformer form="rect" intensity={1.8} color="#fff6ee" position={[-5, 1.6, 2]} scale={[2.5, 5, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="rect" intensity={2.2} color="#ff2a1f" position={[5, 1, -2.5]} scale={[3, 3, 1]} target={[0, 0.3, 0]} />
      </Environment>

      <Extinguisher ref={product} highlight={selected} quality={quality} />
      <ContactShadows position={[0, 0.0015, 0]} scale={1.2} blur={2.2} far={0.7} opacity={0.8} resolution={256} frames={Infinity} />
      <EnvBinder source={envScene} target={product} />
      <Director bus={bus} product={product} />
    </Canvas>
  )
}
