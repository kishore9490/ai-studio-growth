import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshReflectorMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { concreteTexture, signTexture, softSprite } from './textures'
import { Extinguisher } from './Extinguisher'

/**
 * Night-time commercial/industrial bay. Scale: metres. The hero extinguisher stands at the origin.
 * Kept deliberately sparse: architecture frames the product, it never competes with it.
 */

const COLUMN_Z = [-1.8, -6, -10.2, -14.4]
const COLUMN_X = [-2.7, 2.7]
const CEIL = 7.2

type Props = { quality: 'high' | 'low'; ambientMotion: boolean; lightLevel: { current: number } }

export function Facility({ quality, ambientMotion, lightLevel }: Props) {
  const tex = useMemo(() => ({ concrete: concreteTexture(quality === 'high' ? 1024 : 512), sprite: softSprite(), sign: signTexture() }), [quality])

  const colMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1b2027', roughness: 0.55, metalness: 0.45 , envMapIntensity: 0.12 }), [])
  const plinthMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a3038', roughness: 0.8, metalness: 0.1 , envMapIntensity: 0.12 }), [])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#12161b', roughness: 0.7, metalness: 0.35 , envMapIntensity: 0.12 }), [])
  const ribMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e242c', roughness: 0.45, metalness: 0.6 , envMapIntensity: 0.12 }), [])
  const pipeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8e1018', roughness: 0.45, metalness: 0.3 , envMapIntensity: 0.12 }), [])
  const steelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa1a9', roughness: 0.3, metalness: 1, envMapIntensity: 0.5 }), [])
  const stripMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#fff4e6'), emissiveIntensity: 5, toneMapped: false }),
    [],
  )
  const signMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex.sign, emissiveMap: tex.sign, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 1.6, toneMapped: false }),
    [tex.sign],
  )

  // Ribbed wall panels as instanced meshes (one draw call per wall).
  const backRibs = useRef<THREE.InstancedMesh>(null)
  const sideRibs = useRef<THREE.InstancedMesh>(null)
  const BACK_N = 56
  const SIDE_N = 2 * 44
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    if (backRibs.current) {
      for (let i = 0; i < BACK_N; i++) {
        m.makeTranslation(-14 + i * 0.5, CEIL / 2, -17.9)
        backRibs.current.setMatrixAt(i, m)
      }
      backRibs.current.instanceMatrix.needsUpdate = true
    }
    if (sideRibs.current) {
      for (let i = 0; i < SIDE_N; i++) {
        const side = i < SIDE_N / 2 ? -1 : 1
        const k = i % (SIDE_N / 2)
        m.makeTranslation(side * 6.9, CEIL / 2, 4 - k * 0.5)
        sideRibs.current.setMatrixAt(i, m)
      }
      sideRibs.current.instanceMatrix.needsUpdate = true
    }
  }, [])

  // Practical lights breathe very slightly; haze drifts.
  const haze = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const breathe = ambientMotion ? 1 + Math.sin(t * 0.6) * 0.035 + Math.sin(t * 1.7) * 0.015 : 1
    stripMat.emissiveIntensity = 5 * breathe * lightLevel.current
    signMat.emissiveIntensity = 1.6 * (0.6 + 0.4 * lightLevel.current)
    if (haze.current && ambientMotion) {
      haze.current.children.forEach((c, i) => {
        c.position.x = (c.userData.x as number) + Math.sin(t * 0.05 + i * 1.7) * 0.8
        c.position.y = (c.userData.y as number) + Math.sin(t * 0.07 + i) * 0.15
        ;(c as THREE.Mesh).lookAt(state.camera.position)
      })
    }
  })

  const hazeCards = useMemo(
    () => [
      { x: -1.4, y: 1.2, z: -3.5, s: 7, o: 0.05 },
      { x: 2.0, y: 2.6, z: -7, s: 10, o: 0.06 },
      { x: -2.5, y: 3.4, z: -10, s: 12, o: 0.06 },
      { x: 1.0, y: 0.6, z: -1.8, s: 4.5, o: 0.035 },
      { x: 0.0, y: 4.5, z: -13, s: 14, o: 0.05 },
    ],
    [],
  )

  return (
    <group>
      {/* ——— Floor ——— */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial
            resolution={1024}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={3.2}
            mixContrast={1}
            depthScale={1.1}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.3}
            roughness={0.85}
            roughnessMap={tex.concrete}
            metalness={0.55}
            color="#14181d"
            envMapIntensity={0.35}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial color="#14181d" roughness={0.6} roughnessMap={tex.concrete} metalness={0.4} envMapIntensity={0.35} />
        )}
      </mesh>

      {/* ——— Columns with steel plinths ——— */}
      {COLUMN_X.flatMap((x) =>
        COLUMN_Z.map((z) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, CEIL / 2, 0]} material={colMat}>
              <boxGeometry args={[0.44, CEIL, 0.44]} />
            </mesh>
            <mesh position={[0, 0.15, 0]} material={plinthMat}>
              <boxGeometry args={[0.5, 0.3, 0.5]} />
            </mesh>
            {/* vertical LED practical on the aisle-facing side */}
            <mesh position={[-Math.sign(x) * 0.226, 2.1, 0.12]} material={stripMat}>
              <boxGeometry args={[0.012, 3.4, 0.03]} />
            </mesh>
            {/* thin reflective safety band */}
            <mesh position={[0, 1.2, 0]} material={steelMat}>
              <boxGeometry args={[0.45, 0.025, 0.45]} />
            </mesh>
          </group>
        )),
      )}

      {/* ——— Walls ——— */}
      <mesh position={[0, CEIL / 2, -18]} material={wallMat}>
        <planeGeometry args={[30, CEIL]} />
      </mesh>
      <mesh position={[-7, CEIL / 2, -6]} rotation={[0, Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[30, CEIL]} />
      </mesh>
      <mesh position={[7, CEIL / 2, -6]} rotation={[0, -Math.PI / 2, 0]} material={wallMat}>
        <planeGeometry args={[30, CEIL]} />
      </mesh>
      <instancedMesh ref={backRibs} args={[undefined, undefined, BACK_N]} material={ribMat}>
        <boxGeometry args={[0.07, CEIL, 0.12]} />
      </instancedMesh>
      <instancedMesh ref={sideRibs} args={[undefined, undefined, SIDE_N]} material={ribMat}>
        <boxGeometry args={[0.12, CEIL, 0.07]} />
      </instancedMesh>

      {/* horizontal girts: make the ribbed walls read as steel cladding */}
      {[2.2, 4.6].map((y) => (
        <group key={`g${y}`}>
          <mesh position={[0, y, -17.82]} material={colMat}>
            <boxGeometry args={[28, 0.14, 0.2]} />
          </mesh>
          <mesh position={[-6.86, y, -6]} material={colMat}>
            <boxGeometry args={[0.2, 0.14, 26]} />
          </mesh>
          <mesh position={[6.86, y, -6]} material={colMat}>
            <boxGeometry args={[0.2, 0.14, 26]} />
          </mesh>
        </group>
      ))}

      {/* ——— Ceiling, trusses and practical light strips ——— */}
      <mesh position={[0, CEIL, -6]} rotation={[Math.PI / 2, 0, 0]} material={wallMat}>
        <planeGeometry args={[14, 30]} />
      </mesh>
      {[2, -2, -6, -10, -14].map((z) => (
        <mesh key={z} position={[0, CEIL - 0.45, z]} material={colMat}>
          <boxGeometry args={[14, 0.5, 0.18]} />
        </mesh>
      ))}
      {[-1.6, 1.6].flatMap((x) =>
        [0, -4, -8, -12].map((z) => (
          <mesh key={`${x}${z}`} position={[x, CEIL - 0.9, z]} material={stripMat}>
            <boxGeometry args={[0.1, 0.04, 2.6]} />
          </mesh>
        )),
      )}

      {/* ——— Sprinkler main with drops ——— */}
      <mesh position={[0.9, CEIL - 1.25, -6]} rotation={[Math.PI / 2, 0, 0]} material={pipeMat}>
        <cylinderGeometry args={[0.06, 0.06, 26, 16]} />
      </mesh>
      {[3, 0.5, -2, -4.5, -7, -9.5, -12, -14.5].map((z) => (
        <group key={z} position={[0.9, CEIL - 1.25, z]}>
          <mesh position={[0, -0.18, 0]} material={pipeMat}>
            <cylinderGeometry args={[0.018, 0.018, 0.36, 8]} />
          </mesh>
          <mesh position={[0, -0.38, 0]} material={steelMat}>
            <coneGeometry args={[0.04, 0.05, 12]} />
          </mesh>
        </group>
      ))}

      {/* ——— Riser and alarm valve station on the back wall ——— */}
      <group position={[-4.2, 0, -17.6]}>
        <mesh position={[0, CEIL / 2, 0]} material={pipeMat}>
          <cylinderGeometry args={[0.09, 0.09, CEIL, 16]} />
        </mesh>
        <mesh position={[0, 1.3, 0.12]} material={pipeMat}>
          <boxGeometry args={[0.32, 0.5, 0.22]} />
        </mesh>
        <mesh position={[0, 1.3, 0.28]} material={steelMat}>
          <torusGeometry args={[0.16, 0.014, 8, 32]} />
        </mesh>
      </group>

      {/* ——— Hose reel cabinet ——— */}
      <group position={[3.6, 1.45, -17.75]}>
        <mesh material={pipeMat}>
          <boxGeometry args={[1.1, 1.3, 0.3]} />
        </mesh>
        <mesh position={[0, 0.02, 0.152]}>
          <planeGeometry args={[0.92, 1.1]} />
          <meshPhysicalMaterial color="#0b0e12" roughness={0.05} metalness={0.2} clearcoat={1} />
        </mesh>
      </group>

      {/* ——— Fire point: wall-mounted extinguisher + illuminated sign on a column ——— */}
      <group position={[-2.7 + 0.22, 0, -6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 1.55, 0.02]} material={signMat}>
          <planeGeometry args={[0.6, 0.3]} />
        </mesh>
        <mesh position={[0, 0.98, 0.02]} material={steelMat}>
          <boxGeometry args={[0.12, 0.04, 0.05]} />
        </mesh>
        <Extinguisher quality="low" position={[0, 0.42, 0.1]} />
      </group>

      {/* ——— Fake wall washes and floor light pools (additive sprites: cheap depth cues) ——— */}
      {[-9, -4.5, 0, 4.5, 9].map((x, i) => (
        <mesh key={`w${x}`} position={[x, 2.6, -17.8]}>
          <planeGeometry args={[3.2, 6]} />
          <meshBasicMaterial map={tex.sprite} color={i === 1 ? '#ff4433' : '#ffd7b0'} transparent opacity={i === 1 ? 0.3 : 0.2} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
        </mesh>
      ))}
      {[-1.6, 1.6].flatMap((x) =>
        [-4, -8, -12].map((z) => (
          <mesh key={`p${x}${z}`} position={[x * 0.8, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 4.5]} />
            <meshBasicMaterial map={tex.sprite} color="#ffe2c4" transparent opacity={0.07} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        )),
      )}

      {/* ——— Atmospheric haze cards (additive, very low opacity) ——— */}
      <group ref={haze}>
        {hazeCards.map((h, i) => (
          <mesh key={i} position={[h.x, h.y, h.z]} userData={{ x: h.x, y: h.y }}>
            <planeGeometry args={[h.s, h.s * 0.6]} />
            <meshBasicMaterial
              map={tex.sprite}
              color="#c9d2dc"
              transparent
              opacity={h.o}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
