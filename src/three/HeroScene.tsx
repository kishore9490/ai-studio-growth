import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, PerformanceMonitor, SpotLight } from '@react-three/drei'
import * as THREE from 'three'
import { ANCHORS, Extinguisher, type PartId } from './Extinguisher'
import { Facility } from './Facility'
import { composePose, POSE_KEYS, type HeroBus, type Pose } from './heroRig'

export type Quality = 'high' | 'low'

type Props = {
  bus: HeroBus
  quality: Quality
  active: boolean
  capture?: boolean
}

const KEY_INTENSITY = 26
const RIM_INTENSITY = 40
const KICK_INTENSITY = 6

function Rig({ bus, product, lights, lightLevel }: {
  bus: HeroBus
  product: React.RefObject<THREE.Group | null>
  lights: React.RefObject<{ key: THREE.SpotLight | null; rim: THREE.SpotLight | null; kick: THREE.SpotLight | null }>
  lightLevel: { current: number }
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const target = useMemo(() => ({ ...bus.poses.B }) as Pose, [bus])
  const current = useRef<Pose | null>(null)
  const look = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const frames = useRef(0)

  useEffect(() => () => camera.clearViewOffset(), [camera])

  useFrame((state, dt) => {
    composePose(bus, target)
    if (!current.current) current.current = { ...target }
    const c = current.current
    // generous clamp: low-fps devices still converge in a frame or two instead of trailing the scroll
    const d = Math.min(dt, 0.35)
    for (const k of POSE_KEYS) {
      c[k] = bus.reducedMotion ? target[k] : THREE.MathUtils.damp(c[k], target[k], 6.5, d)
    }

    const t = state.clock.elapsedTime
    const idle = bus.reducedMotion ? 0 : 1
    // hand-held "breathing": a few millimetres, scaled so it never reads as shake
    camera.position.set(c.px + Math.sin(t * 0.33) * 0.006 * idle, c.py + Math.sin(t * 0.41) * 0.004 * idle, c.pz + Math.cos(t * 0.29) * 0.006 * idle)
    look.set(c.tx, c.ty, c.tz)
    camera.lookAt(look)
    camera.fov = c.fov
    const { width, height } = state.size
    camera.setViewOffset(width, height, -c.sx * width, -c.sy * height, width, height)
    camera.updateProjectionMatrix()

    if (product.current) product.current.rotation.y = c.rot + Math.sin(t * 0.22) * 0.025 * idle

    const L = lights.current
    if (L.key) L.key.intensity = KEY_INTENSITY * c.key
    if (L.rim) L.rim.intensity = RIM_INTENSITY * c.rim
    if (L.kick) L.kick.intensity = KICK_INTENSITY * c.rim
    lightLevel.current = c.room

    // Project annotation anchors into the hero's DOM layer.
    if (product.current) {
      product.current.updateWorldMatrix(true, false)
      for (const id of Object.keys(bus.annotationEls) as PartId[]) {
        const el = bus.annotationEls[id]
        if (!el) continue
        tmp.set(...ANCHORS[id])
        product.current.localToWorld(tmp)
        tmp.project(camera)
        const x = (tmp.x * 0.5 + 0.5) * width
        const y = (-tmp.y * 0.5 + 0.5) * height
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      }
    }

    frames.current++
    if (frames.current === 3 && !bus.ready) {
      bus.ready = true
      bus.onReady?.()
    }
  })
  return null
}

/**
 * The Lightformer environment renders into a private scene and is bound only to the product's materials.
 * (scene.environment would make every surface — floor, walls — mirror the studio lights.)
 */
export function EnvBinder({ source, target, intensity = 1 }: { source: THREE.Scene; target: React.RefObject<THREE.Object3D | null>; intensity?: number }) {
  const bound = useRef<THREE.Texture | null>(null)
  useFrame(() => {
    const tex = source.environment
    if (!tex || !target.current || bound.current === tex) return
    target.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m && 'envMap' in m) {
        m.envMap = tex
        m.envMapIntensity = intensity
        m.needsUpdate = true
      }
    })
    bound.current = tex
  })
  return null
}

/** A narrow light strip travelling across the reflection environment: produces a slow highlight sweep on the paint. */
function SweepFormer({ enabled }: { enabled: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const phase = enabled ? (t * 0.09) % 1 : 0.35
    ref.current.position.set(THREE.MathUtils.lerp(-7, 7, phase), 1.5, 5)
  })
  return <Lightformer ref={ref} form="rect" intensity={2.4} color="#ffffff" scale={[0.5, 8, 1]} position={[0, 1.5, 5]} target={[0, 0.3, 0]} />
}

export default function HeroScene({ bus, quality, active, capture = false }: Props) {
  const product = useRef<THREE.Group>(null)
  const key = useRef<THREE.SpotLight>(null)
  const rim = useRef<THREE.SpotLight>(null)
  const kick = useRef<THREE.SpotLight>(null)
  const lights = useRef<{ key: THREE.SpotLight | null; rim: THREE.SpotLight | null; kick: THREE.SpotLight | null }>({ key: null, rim: null, kick: null })
  const lightLevel = useMemo(() => ({ current: 1 }), [])
  const envScene = useMemo(() => new THREE.Scene(), [])
  const [dpr, setDpr] = useState<number>(quality === 'high' ? 1.75 : 1.5)
  const high = quality === 'high'

  // Spotlight targets must be in the scene graph to aim; wire them once.
  const keyTarget = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(0, 0.32, 0)
    return o
  }, [])

  useEffect(() => {
    lights.current = { key: key.current, rim: rim.current, kick: kick.current }
    ;[key, rim, kick].forEach((l) => {
      if (l.current) l.current.target = keyTarget
    })
  })

  return (
    <Canvas
      dpr={capture ? 1 : [1, dpr]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: capture }}
      camera={{ fov: 30, near: 0.02, far: 60, position: [3.4, 2.3, 6.2] }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        // Render targets (contact shadows, reflector) must clear to transparent, not opaque black.
        gl.setClearAlpha(0)
        scene.background = new THREE.Color('#07090c')
        scene.fog = new THREE.Fog('#07090c', 7, 26)
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} />
      <primitive object={keyTarget} />

      {/* Key: broad, soft, above camera-left — reveals the cylinder's form */}
      <spotLight ref={key} position={[-1.8, 2.9, 2.4]} angle={0.42} penumbra={1} decay={2} color="#fff3e8" intensity={KEY_INTENSITY} />
      {/* Red rim: behind camera-right — separates the silhouette from the dark bay */}
      <spotLight ref={rim} position={[0.95, 1.5, -1.55]} angle={0.3} penumbra={0.7} decay={1.5} distance={2.55} color="#ff3b2f" intensity={RIM_INTENSITY} />
      {/* Cool kicker: behind camera-left — the opposite edge */}
      <spotLight ref={kick} position={[-1.1, 1.3, -1.3]} angle={0.3} penumbra={1} decay={1.5} distance={2.3} color="#b8d4ff" intensity={KICK_INTENSITY} />
      {/* Neutral specular for the chrome fittings */}
      <pointLight position={[0.35, 0.95, 0.65]} intensity={0.9} distance={2.2} decay={2} color="#ffffff" />
      <hemisphereLight args={['#6b7581', '#07090c', 0.45]} />
      {/* High practical fill from the ceiling run — gives the bay its depth */}
      <pointLight position={[0, 5.8, -3.5]} intensity={42} distance={18} decay={1.5} color="#ffe6cc" />
      <pointLight position={[0, 5.8, -11]} intensity={50} distance={18} decay={1.5} color="#ffe6cc" />
      {/* soft wash grazing the back wall */}
      <spotLight position={[0, 6.5, -9]} target-position={[0, 0, -18]} angle={0.9} penumbra={1} intensity={60} decay={1.5} distance={16} color="#ffd9b8" />

      {/* Overhead practical with a visible (volumetric) cone on capable devices */}
      {high ? (
        <SpotLight
          position={[0.25, 6.2, 0.1]}
          target={keyTarget}
          angle={0.24}
          penumbra={0.9}
          distance={7.5}
          attenuation={6.5}
          anglePower={4.5}
          radiusTop={0.06}
          radiusBottom={1.5}
          opacity={0.32}
          intensity={18}
          color="#fff1df"
          volumetric
        />
      ) : (
        <spotLight position={[0.25, 6.2, 0.1]} target={keyTarget} angle={0.24} penumbra={0.9} intensity={18} decay={2} color="#fff1df" />
      )}

      <Environment scene={envScene} resolution={high ? 256 : 128} frames={high && !capture ? Infinity : 1} background={false}>
        <color attach="background" args={['#050608']} />
        {/* ceiling strips reflected along the top of the cylinder */}
        {[-3, 0, 3].map((z) => (
          <Lightformer key={z} form="rect" intensity={1.6} rotation-x={Math.PI / 2} position={[0, 5, z]} scale={[0.6, 8, 1]} />
        ))}
        {/* overhead softbox: reads on chrome tops and the cylinder shoulder */}
        <Lightformer form="rect" intensity={1.1} rotation-x={Math.PI / 2} position={[0, 4, 0]} scale={[5, 5, 1]} />
        {/* dim front fill from the camera side so fittings never go fully black */}
        <Lightformer form="rect" intensity={0.45} color="#d9e2ec" position={[2, 0.8, 5]} scale={[6, 2, 1]} target={[0, 0.4, 0]} />
        {/* large softbox camera-left: the long vertical highlight on the paint */}
        <Lightformer form="rect" intensity={1.8} color="#fff6ee" position={[-5, 1.6, 2]} scale={[2.5, 5, 1]} target={[0, 0.3, 0]} />
        {/* red bounce camera-right */}
        <Lightformer form="rect" intensity={2.2} color="#ff2a1f" position={[5, 1, -2.5]} scale={[3, 3, 1]} target={[0, 0.3, 0]} />
        <Lightformer form="ring" intensity={0.8} color="#9fb8ff" position={[-3, 3, -5]} scale={2} target={[0, 0.3, 0]} />
        <SweepFormer enabled={high && !bus.reducedMotion && !capture} />
      </Environment>

      <Facility quality={quality} ambientMotion={!bus.reducedMotion && !capture} lightLevel={lightLevel} />
      <Extinguisher ref={product} quality={quality} />
      <ContactShadows position={[0, 0.0015, 0]} scale={1.4} blur={2.4} far={0.7} opacity={0.85} resolution={high ? 512 : 256} frames={capture ? 40 : Infinity} color="#000000" />

      <EnvBinder source={envScene} target={product} />
      <Rig bus={bus} product={product} lights={lights} lightLevel={lightLevel} />
    </Canvas>
  )
}
