import * as THREE from 'three';

export type SceneKind = 'helix' | 'network';

export interface MountOptions {
  kind: SceneKind;
  /** Element whose centre the 3D subject should sit behind. */
  anchor: HTMLElement | null;
  reducedMotion: boolean;
  /** Allow software (CPU) WebGL renderers. Used only by automated tests. */
  allowSoftwareRenderer?: boolean;
  onFirstFrame: () => void;
}

interface Frame {
  time: number;
  delta: number;
  /** Pointer position in -1..1, smoothed. */
  pointer: THREE.Vector2;
  /** Page scroll in pixels. */
  scroll: number;
}

interface Built {
  root: THREE.Object3D;
  update: (frame: Frame) => void;
  dispose: () => void;
}

const GOLD = new THREE.Color('#d9bd86');
const ROYAL = new THREE.Color('#7f9dff');
const WHITE = new THREE.Color('#e9eefb');

/* Soft round glowing points with per-point size, colour and pulse phase. */
const pointsVertex = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float pulse = 0.82 + 0.18 * sin(uTime * 1.4 + aPhase);
    gl_PointSize = aSize * pulse * uPixelRatio * (52.0 / -mv.z);
    vColor = aColor;
    vAlpha = smoothstep(34.0, 8.0, -mv.z);
  }
`;

const pointsFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float glow = pow(core, 1.8);
    gl_FragColor = vec4(vColor, glow * vAlpha);
  }
`;

function pointsMaterial(pixelRatio: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    vertexShader: pointsVertex,
    fragmentShader: pointsFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

function pointCloud(positions: number[], colors: THREE.Color[], sizes: number[], pixelRatio: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors.flatMap((c) => [c.r, c.g, c.b]), 3));
  geometry.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
  geometry.setAttribute('aPhase', new THREE.Float32BufferAttribute(sizes.map(() => Math.random() * Math.PI * 2), 1));
  const material = pointsMaterial(pixelRatio);
  return { points: new THREE.Points(geometry, material), geometry, material };
}

function lines(segments: number[], colors: number[], opacity: number) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(segments, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return { lines: new THREE.LineSegments(geometry, material), geometry, material };
}

/** Background field of drifting stars, shared by both scenes. */
function starField(count: number, pixelRatio: number) {
  const positions: number[] = [];
  const colors: THREE.Color[] = [];
  const sizes: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push((Math.random() - 0.5) * 44, (Math.random() - 0.5) * 30, -Math.random() * 22 + 2);
    colors.push(Math.random() < 0.15 ? GOLD : Math.random() < 0.5 ? ROYAL : WHITE);
    sizes.push(0.6 + Math.random() * 1.4);
  }
  return pointCloud(positions, colors, sizes, pixelRatio);
}

/** DNA double helix: two glowing strands joined by rungs. */
function buildHelix(pixelRatio: number, small: boolean): Built {
  const root = new THREE.Group();
  const helix = new THREE.Group();
  root.add(helix);

  const perStrand = small ? 70 : 110;
  const height = 13;
  const radius = 1.9;
  const turns = 3.2;
  const positions: number[] = [];
  const colors: THREE.Color[] = [];
  const sizes: number[] = [];
  const rungs: number[] = [];
  const rungColors: number[] = [];

  for (let i = 0; i < perStrand; i++) {
    const t = i / (perStrand - 1);
    const angle = t * turns * Math.PI * 2;
    const y = (t - 0.5) * height;
    const a = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const b = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    colors.push(GOLD, ROYAL);
    sizes.push(3.4, 3.4);
    if (i % 3 === 0) {
      // Rung with a few small nodes along it.
      rungs.push(a.x, a.y, a.z, b.x, b.y, b.z);
      rungColors.push(GOLD.r, GOLD.g, GOLD.b, ROYAL.r, ROYAL.g, ROYAL.b);
      for (const k of [0.25, 0.5, 0.75]) {
        const p = a.clone().lerp(b, k);
        positions.push(p.x, p.y, p.z);
        colors.push(WHITE);
        sizes.push(1.3);
      }
    }
  }

  const strand = pointCloud(positions, colors, sizes, pixelRatio);
  const rungLines = lines(rungs, rungColors, 0.4);
  helix.add(strand.points, rungLines.lines);

  // Orbiting halo particles around the helix.
  const haloPositions: number[] = [];
  const haloColors: THREE.Color[] = [];
  const haloSizes: number[] = [];
  const haloCount = small ? 140 : 260;
  for (let i = 0; i < haloCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = radius + 0.8 + Math.random() * 2.6;
    haloPositions.push(Math.cos(angle) * r, (Math.random() - 0.5) * height * 1.1, Math.sin(angle) * r);
    haloColors.push(Math.random() < 0.3 ? GOLD : ROYAL);
    haloSizes.push(0.8 + Math.random() * 1.2);
  }
  const halo = pointCloud(haloPositions, haloColors, haloSizes, pixelRatio);
  root.add(halo.points);

  const stars = starField(small ? 260 : 520, pixelRatio);
  stars.points.position.z = -4;

  const materials = [strand.material, halo.material, stars.material];
  // Diagonal so the helix reads on both sides of the portrait.
  helix.rotation.z = -0.8;

  return {
    root: new THREE.Group().add(root, stars.points),
    update: ({ time, delta, pointer, scroll }) => {
      for (const m of materials) m.uniforms.uTime!.value = time;
      helix.rotation.y += delta * 0.32;
      halo.points.rotation.y -= delta * 0.08;
      root.rotation.x += (pointer.y * 0.25 - root.rotation.x) * 0.05;
      root.rotation.y += (pointer.x * 0.35 + scroll * 0.0012 - root.rotation.y) * 0.05;
      root.position.y = (root.userData.baseY ?? 0) + scroll * 0.004;
      stars.points.rotation.y = time * 0.01 + pointer.x * 0.05;
      stars.points.rotation.x = pointer.y * 0.04;
    },
    dispose: () => {
      for (const g of [strand.geometry, rungLines.geometry, halo.geometry, stars.geometry]) g.dispose();
      for (const m of [...materials, rungLines.material]) m.dispose();
    },
  };
}

/** Knowledge network: nodes on a sphere linked to their nearest neighbours. */
function buildNetwork(pixelRatio: number, small: boolean): Built {
  const root = new THREE.Group();
  const globe = new THREE.Group();
  root.add(globe);

  const count = small ? 110 : 180;
  const radius = 4.2;
  const nodes: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    nodes.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r).multiplyScalar(radius * jitter));
  }
  // Seven highlighted nodes: a nod to the seven stated priorities.
  const highlighted = new Set(Array.from({ length: 7 }, (_, i) => Math.floor((i + 0.5) * (count / 7))));

  const segments: number[] = [];
  const segmentColors: number[] = [];
  nodes.forEach((a, i) => {
    const nearest = nodes
      .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
      .filter(({ j }) => j > i)
      .sort((p, q) => p.d - q.d)
      .slice(0, 3);
    for (const { j } of nearest) {
      const b = nodes[j]!;
      segments.push(a.x, a.y, a.z, b.x, b.y, b.z);
      const ca = highlighted.has(i) ? GOLD : ROYAL;
      const cb = highlighted.has(j) ? GOLD : ROYAL;
      segmentColors.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b);
    }
  });

  const cloud = pointCloud(
    nodes.flatMap((n) => [n.x, n.y, n.z]),
    nodes.map((_, i) => (highlighted.has(i) ? GOLD : i % 5 === 0 ? WHITE : ROYAL)),
    nodes.map((_, i) => (highlighted.has(i) ? 4.2 : 1.6)),
    pixelRatio,
  );
  const web = lines(segments, segmentColors, 0.13);
  globe.add(cloud.points, web.lines);

  // Equatorial orbit ring of fine particles.
  const ringPositions: number[] = [];
  const ringColors: THREE.Color[] = [];
  const ringSizes: number[] = [];
  for (let i = 0; i < (small ? 120 : 220); i++) {
    const angle = (i / (small ? 120 : 220)) * Math.PI * 2;
    const r = radius * 1.45 + (Math.random() - 0.5) * 0.5;
    ringPositions.push(Math.cos(angle) * r, (Math.random() - 0.5) * 0.25, Math.sin(angle) * r);
    ringColors.push(i % 4 === 0 ? GOLD : WHITE);
    ringSizes.push(0.9 + Math.random());
  }
  const ring = pointCloud(ringPositions, ringColors, ringSizes, pixelRatio);
  ring.points.rotation.x = 1.15;
  ring.points.rotation.z = 0.3;
  root.add(ring.points);

  const stars = starField(small ? 200 : 380, pixelRatio);
  stars.points.position.z = -6;
  const materials = [cloud.material, ring.material, stars.material];

  return {
    root: new THREE.Group().add(root, stars.points),
    update: ({ time, delta, pointer, scroll }) => {
      for (const m of materials) m.uniforms.uTime!.value = time;
      globe.rotation.y += delta * 0.12;
      ring.points.rotation.y += delta * 0.05;
      root.rotation.x += (pointer.y * 0.3 + 0.2 - root.rotation.x) * 0.05;
      root.rotation.z += (pointer.x * -0.12 - root.rotation.z) * 0.05;
      root.position.y = (root.userData.baseY ?? 0) + scroll * 0.003;
      stars.points.rotation.y = time * 0.008 + pointer.x * 0.04;
    },
    dispose: () => {
      for (const g of [cloud.geometry, web.geometry, ring.geometry, stars.geometry]) g.dispose();
      for (const m of [...materials, web.material]) m.dispose();
    },
  };
}

/**
 * Mounts a scene on a canvas and returns a cleanup function, or null when
 * WebGL is unavailable (the caller keeps its CSS fallback).
 */
export function mountScene(canvas: HTMLCanvasElement, options: MountOptions): (() => void) | null {
  const small = window.matchMedia('(max-width: 767px)').matches;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }

  // Software renderers (no GPU) would run the scene on the CPU and make the
  // page sluggish; those visitors keep the static design instead.
  if (!options.allowSoftwareRenderer) {
    const gl = renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    if (/swiftshader|llvmpipe|software|softpipe/i.test(name)) {
      renderer.dispose();
      renderer.forceContextLoss();
      return null;
    }
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.75);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 18);

  const built = options.kind === 'helix' ? buildHelix(pixelRatio, small) : buildNetwork(pixelRatio, small);
  const subject = built.root.children[0]!;
  scene.add(built.root);

  // Place the subject behind the anchor element, in world units.
  const placeSubject = () => {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const worldWidth = worldHeight * camera.aspect;
    const anchor = options.anchor?.getBoundingClientRect();
    const cx = anchor ? (anchor.left + anchor.width / 2 - rect.left) / rect.width : 0.75;
    const cy = anchor ? (anchor.top + anchor.height / 2 - rect.top) / rect.height : 0.45;
    subject.position.set((cx - 0.5) * worldWidth, (0.5 - cy) * worldHeight, 0);
    subject.userData.baseY = subject.position.y;
    // Scale the subject to roughly fill the anchor's height (helix ≈ 13 units tall, globe ≈ 12 wide).
    // The helix extends well past the portrait; the globe fits inside its anchor.
    const subjectSize = options.kind === 'helix' ? 13 : 12;
    const reach = options.kind === 'helix' ? 2.1 : 1;
    const anchorPx = anchor ? Math.min(anchor.height, options.kind === 'helix' ? anchor.height : anchor.width) : rect.height * 0.7;
    const anchorWorld = (anchorPx / rect.height) * worldHeight;
    const fit = THREE.MathUtils.clamp((anchorWorld * reach) / subjectSize, 0.4, 1.8);
    subject.scale.setScalar(fit);
  };

  const pointerTarget = new THREE.Vector2();
  const pointer = new THREE.Vector2();
  const onPointer = (event: PointerEvent) => {
    pointerTarget.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
  };

  const timer = new THREE.Timer();
  let frameId = 0;
  let visible = true;
  let first = true;

  const render = () => {
    timer.update();
    const delta = Math.min(timer.getDelta(), 0.05);
    pointer.lerp(pointerTarget, 0.06);
    built.update({ time: timer.getElapsed(), delta, pointer, scroll: window.scrollY });
    renderer.render(scene, camera);
    if (first) {
      first = false;
      options.onFirstFrame();
    }
  };

  // Phones render at ~30 fps to save battery and main-thread time.
  let skip = false;
  const loop = () => {
    frameId = 0;
    if (!visible || document.hidden) return;
    skip = small && !skip;
    if (!skip) render();
    frameId = requestAnimationFrame(loop);
  };
  const start = () => {
    if (!options.reducedMotion && !frameId) {
      timer.update(); // discard time spent paused
      frameId = requestAnimationFrame(loop);
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    placeSubject();
    if (options.reducedMotion) render();
  });
  resizeObserver.observe(canvas);

  const intersection = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting;
    if (visible) start();
  });
  intersection.observe(canvas);

  const onVisibility = () => !document.hidden && start();
  document.addEventListener('visibilitychange', onVisibility);
  if (!options.reducedMotion) window.addEventListener('pointermove', onPointer, { passive: true });

  placeSubject();
  if (options.reducedMotion) {
    // One still frame with a pleasing angle.
    built.update({ time: 2, delta: 0.6, pointer, scroll: 0 });
    render();
  } else {
    start();
  }

  return () => {
    cancelAnimationFrame(frameId);
    resizeObserver.disconnect();
    intersection.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pointermove', onPointer);
    built.dispose();
    timer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
