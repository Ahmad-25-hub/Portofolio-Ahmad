"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fbm2D, simplex3D } from "./glsl";
import { gsap } from "@/lib/gsap";
import { cursorBus, heroState, usePageReady } from "@/lib/store";

/* ------------------------------------------------------------------ */
/* Shared pointer (window-level, so the canvas can sit behind content) */
/* ------------------------------------------------------------------ */
const pointer = { x: 0, y: 0, speed: 0, cx: -9999, cy: -9999 };
function usePointerTracking() {
  useEffect(() => {
    let lx = 0;
    let ly = 0;
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.speed = Math.min(1, pointer.speed + Math.hypot(x - lx, y - ly) * 2.5);
      pointer.x = x;
      pointer.y = y;
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
      lx = x;
      ly = y;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
}

/* ------------------------------------------------------------------ */
/* Composition: where the portrait stands, in world units at z = 0     */
/* ------------------------------------------------------------------ */
const PHOTO = {
  src: "/images/ahmad.png",
  aspect: 408 / 612,
  /** Fraction of the image height above the top of the head. */
  headTop: 0.12,
};

function heroLayout(W: number, H: number) {
  const tall = W / H < 0.8;
  const ph = Math.min(H * 1.22, W * (tall ? 1.6 : 1.9));
  const pw = ph * PHOTO.aspect;
  const headY = H / 2 - (tall ? 0.34 : 0.14) * H;
  const top = headY + PHOTO.headTop * ph;
  return { pw, ph, cy: top - ph / 2, headY };
}

/* ------------------------------------------------------------------ */
/* Iridescent noise blob                                               */
/* ------------------------------------------------------------------ */
const blobVertex = /* glsl */ `
uniform float uTime;
uniform float uDistort;
uniform float uFreq;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;

${simplex3D}

float displace(vec3 p){
  float t = uTime * 0.16;
  vec3 q = p * uFreq + vec3(0.0, t, t * 0.7);
  q += 0.3 * snoise(q * 0.5 + t * 0.5);           // gentle domain warp
  float n = snoise(q);
  float ripple = snoise(q * 2.2 - t * 1.3);         // fine liquid ripples (smooth)
  return n * uDistort + ripple * uDistort * 0.12;
}

vec3 orthogonal(vec3 v){
  return normalize(abs(v.x) > abs(v.z) ? vec3(-v.y, v.x, 0.0) : vec3(0.0, -v.z, v.y));
}

void main(){
  vec3 n = normalize(position);
  vec3 p = n;
  float d = displace(p);
  vec3 displaced = p + n * d;

  // Recompute the normal from two neighbouring displaced samples.
  float eps = 0.004;
  vec3 tangent = orthogonal(n);
  vec3 bitangent = normalize(cross(n, tangent));
  vec3 p1 = normalize(p + tangent * eps);
  vec3 p2 = normalize(p + bitangent * eps);
  vec3 d1 = p1 + p1 * displace(p1);
  vec3 d2 = p2 + p2 * displace(p2);
  vec3 newNormal = normalize(cross(d1 - displaced, d2 - displaced));

  vDisp = d;
  vNormal = normalize(normalMatrix * newNormal);
  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const blobFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uAccent;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;

// Inigo Quilez cosine palette — tuned for a warm/cool thin-film look.
vec3 palette(float t){
  return vec3(0.5) + vec3(0.5) * cos(6.28318 * (vec3(1.0) * t + vec3(0.02, 0.18, 0.42)));
}

void main(){
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.6);

  vec3 irid = palette(ndv * 0.85 + vDisp * 2.2 + uTime * 0.025);

  // Studio lighting
  vec3 L1 = normalize(vec3(-0.55, 0.85, 0.65));
  vec3 L2 = normalize(vec3(0.9, -0.35, 0.35));
  float diff = max(dot(N, L1), 0.0);
  float spec1 = pow(max(dot(N, normalize(L1 + V)), 0.0), 120.0);
  float spec2 = pow(max(dot(N, normalize(L2 + V)), 0.0), 26.0);

  // Fake softbox reflections → reads like polished chrome
  vec3 R = reflect(-V, N);
  float softbox = smoothstep(0.45, 0.95, R.y) * 0.85
                + smoothstep(0.65, 1.0, -R.x) * 0.35
                + smoothstep(0.8, 1.0, R.x * 0.7 - R.y * 0.7) * 0.25;

  vec3 col = vec3(0.004, 0.004, 0.006);
  col += diff * 0.025;
  col += irid * fres * 0.75;
  col += softbox * mix(vec3(0.9), irid, 0.45) * 0.45;
  col += uAccent * spec2 * 0.55;
  col += vec3(1.0) * spec1 * 1.4;
  col += uAccent * pow(1.0 - ndv, 7.0) * 0.9;

  col = 1.0 - exp(-col * 1.5);            // soft tone-map
  col = pow(col, vec3(1.0 / 2.2));        // linear → sRGB
  gl_FragColor = vec4(col, 1.0);
}
`;

function Blob({ detail }: { detail: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();
  const ready = usePageReady();
  const intro = useRef({ v: 0 });
  const smooth = useRef({ x: 0, y: 0, speed: 0 });

  // Initial uniforms; per-frame updates go through the material ref.
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uDistort: { value: 0.2 },
    uFreq: { value: 0.85 },
    uAccent: { value: new THREE.Color("#ff5a1f") },
  }));

  useEffect(() => {
    if (!ready) return;
    const tween = gsap.to(intro.current, { v: 1, duration: 2.6, ease: "expo.out", delay: 0.1 });
    return () => {
      tween.kill();
    };
  }, [ready]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const u = mat.current?.uniforms;
    if (!m || !u) return;
    const t = state.clock.elapsedTime;
    const s = smooth.current;
    const p = heroState.progress;
    const dt = Math.min(delta, 0.05);

    pointer.speed *= 0.92;
    s.x = THREE.MathUtils.damp(s.x, pointer.x, 2.5, dt);
    s.y = THREE.MathUtils.damp(s.y, pointer.y, 2.5, dt);
    s.speed = THREE.MathUtils.damp(s.speed, pointer.speed, 4, dt);

    const k = intro.current.v;
    u.uTime.value = t;
    u.uDistort.value = 0.17 + s.speed * 0.16 + p * 0.3 + (1 - k) * 0.35;

    m.rotation.y = t * 0.07 + s.x * 0.55;
    m.rotation.x = -s.y * 0.35 + p * 1.1;
    m.rotation.z = t * 0.03;

    // An iridescent aura floating behind the portrait's head and shoulders.
    const W = viewport.width;
    const H = viewport.height;
    const { pw, ph, headY } = heroLayout(W, H);
    const base = Math.min(H * 0.23, W * 0.36);
    const scale = base * (0.55 + 0.45 * k) * (1 - p * 0.2);
    m.scale.setScalar(scale);
    m.position.x = pw * 0.12 - s.x * W * 0.025;
    m.position.y = headY - ph * 0.2 + s.y * 0.06 + p * H * 0.45;
  });

  return (
    <mesh ref={mesh}>
      <icosahedronGeometry args={[1, detail]} />
      <shaderMaterial ref={mat} vertexShader={blobVertex} fragmentShader={blobFragment} uniforms={uniforms} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Dust particles                                                      */
/* ------------------------------------------------------------------ */
const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSeed;
varying float vAlpha;
void main(){
  vec3 p = position;
  p.y += sin(uTime * 0.25 + aSeed * 6.2831) * 0.12;
  p.x += cos(uTime * 0.2 + aSeed * 12.0) * 0.08;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
  vAlpha = twinkle * smoothstep(-14.0, -4.0, mv.z);
  gl_PointSize = (1.4 + aSeed * 2.4) * uPixelRatio * (6.0 / -mv.z);
}
`;

const particleFragment = /* glsl */ `
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.55;
  gl_FragColor = vec4(vec3(0.93, 0.91, 0.88), a);
}
`;

function Particles({ count }: { count: number }) {
  const group = useRef<THREE.Points>(null);
  const { gl } = useThree();
  const smooth = useRef({ x: 0, y: 0 });

  const [positions, seeds] = useMemo(() => {
    // Deterministic PRNG (mulberry32) keeps renders pure and the field stable.
    let a = 1337;
    const rand = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 2.2 + rand() * 5.5;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta) * 1.6;
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi) - 2;
      seed[i] = rand();
    }
    return [pos, seed];
  }, [count]);

  const mat = useRef<THREE.ShaderMaterial>(null);
  const [uniforms] = useState(() => ({
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
  }));

  useFrame((state, delta) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
    const s = smooth.current;
    s.x = THREE.MathUtils.damp(s.x, pointer.x, 1.5, delta);
    s.y = THREE.MathUtils.damp(s.y, pointer.y, 1.5, delta);
    if (group.current) {
      group.current.rotation.y = state.clock.elapsedTime * 0.015 + s.x * 0.12;
      group.current.rotation.x = -s.y * 0.08;
      group.current.position.y = heroState.progress * 1.5;
    }
  });

  return (
    <points ref={group}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        vertexShader={particleVertex}
        fragmentShader={particleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Portrait — graded B&W cut-out with rim lights, dissolve reveal and  */
/* a colour lens that follows the cursor over the silhouette.          */
/* ------------------------------------------------------------------ */
const portraitVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const portraitFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uReveal;
uniform float uLens;
uniform float uLensR;
uniform vec2 uMouse;
uniform vec2 uPxToUv;
uniform vec2 uTexel;
uniform vec3 uAccent;
varying vec2 vUv;

${fbm2D}

void main(){
  vec2 uv = vUv;

  // ---- Lens (screen space, matches the 140px cursor ring) ----
  vec2 toM = gl_FragCoord.xy - uMouse;
  float d = length(toM);
  float R = max(uLensR * uLens, 0.001);
  float inLens = (1.0 - smoothstep(R - 1.5, R, d)) * step(0.02, uLens);
  float nd = clamp(d / R, 0.0, 1.0);
  vec2 uvL = uv - toM * uPxToUv * 0.22 * inLens * (1.0 - nd * nd);      // magnify
  vec2 ca = normalize(toM + 1e-4) * uPxToUv * 7.0 * nd * nd * inLens;  // chromatic split at the rim

  vec4 base = texture2D(uMap, uvL);
  vec3 color = vec3(texture2D(uMap, uvL + ca).r, base.g, texture2D(uMap, uvL - ca).b);
  float a = base.a;

  // ---- Editorial black & white grade ----
  float l = dot(base.rgb, vec3(0.299, 0.587, 0.114));
  l = pow(smoothstep(0.03, 0.93, l), 1.08);
  vec3 mono = vec3(l) * vec3(1.02, 0.99, 0.95);
  vec3 col = mix(mono, color * 1.06, inLens);

  // ---- Rim lights from the cut-out's alpha edges ----
  float aR = texture2D(uMap, uv + vec2(uTexel.x * 4.0, 0.0)).a;
  float aL = texture2D(uMap, uv + vec2(-uTexel.x * 4.0, uTexel.y * 2.0)).a;
  col += uAccent * a * (1.0 - aR) * 1.15;
  col += vec3(0.55, 0.62, 1.0) * a * (1.0 - aL) * 0.5;

  // ---- Film grain ----
  col += (hash21(gl_FragCoord.xy + fract(uTime * 13.0) * 97.0) - 0.5) * 0.09;

  // ---- Dissolve reveal, bottom → top, with an ember edge ----
  float n = fbm(uv * vec2(9.0, 13.5));
  float v = clamp((uv.y - 0.2) / 0.8, 0.0, 1.0) * 0.8 + n * 0.3;
  float r = uReveal * 1.16;
  float vis = smoothstep(r, r - 0.015, v);
  float edge = smoothstep(0.045, 0.0, abs(v - r)) * (1.0 - step(1.0, uReveal));
  col = mix(col, uAccent * 1.7, edge);
  a *= max(vis, edge * 0.9);

  gl_FragColor = vec4(col, a);
}
`;

type AlphaMap = { w: number; h: number; data: Uint8ClampedArray };

function PortraitMesh({ texture, alpha }: { texture: THREE.Texture; alpha: AlphaMap }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { viewport, gl } = useThree();
  const ready = usePageReady();
  const reveal = useRef({ v: 0 });
  const smooth = useRef({ x: 0, y: 0, lens: 0 });

  const [uniforms] = useState(() => ({
    uMap: { value: texture },
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uLens: { value: 0 },
    uLensR: { value: 70 },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uPxToUv: { value: new THREE.Vector2(0.001, 0.001) },
    uTexel: { value: new THREE.Vector2(1 / alpha.w, 1 / alpha.h) },
    uAccent: { value: new THREE.Vector3(1.0, 0.353, 0.122) },
  }));

  useEffect(() => {
    if (!ready) return;
    const tween = gsap.to(reveal.current, { v: 1, duration: 2.6, ease: "power2.inOut", delay: 0.15 });
    return () => {
      tween.kill();
    };
  }, [ready]);

  useEffect(
    () => () => {
      cursorBus.lens = false;
    },
    [],
  );

  useFrame((state, delta) => {
    const m = mesh.current;
    const u = mat.current?.uniforms;
    if (!m || !u) return;
    const dt = Math.min(delta, 0.05);
    const W = viewport.width;
    const H = viewport.height;
    const p = heroState.progress;
    const s = smooth.current;
    const { pw, ph, cy } = heroLayout(W, H);

    s.x = THREE.MathUtils.damp(s.x, pointer.x, 2, dt);
    s.y = THREE.MathUtils.damp(s.y, pointer.y, 2, dt);
    m.scale.set(pw, ph, 1);
    m.position.x = s.x * W * 0.012;
    m.position.y = cy + s.y * H * 0.006 - p * H * 0.15;

    // Hit-test the pointer against the silhouette's alpha.
    const rect = gl.domElement.getBoundingClientRect();
    const dpr = gl.getPixelRatio();
    let over = false;
    const inside =
      pointer.cx >= rect.left && pointer.cx <= rect.right && pointer.cy >= rect.top && pointer.cy <= rect.bottom;
    if (inside && reveal.current.v > 0.9 && p < 0.6) {
      const wx = (((pointer.cx - rect.left) / rect.width) * 2 - 1) * (W / 2);
      const wy = (-((pointer.cy - rect.top) / rect.height) * 2 + 1) * (H / 2);
      const tu = (wx - m.position.x) / pw + 0.5;
      const tv = (wy - m.position.y) / ph + 0.5;
      if (tu >= 0 && tu <= 1 && tv >= 0 && tv <= 1) {
        const px = Math.floor(tu * (alpha.w - 1));
        const py = Math.floor((1 - tv) * (alpha.h - 1));
        over = alpha.data[(py * alpha.w + px) * 4 + 3] > 90;
      }
    }
    cursorBus.lens = over;
    s.lens = THREE.MathUtils.damp(s.lens, over ? 1 : 0, 7, dt);

    u.uTime.value = state.clock.elapsedTime;
    u.uReveal.value = reveal.current.v;
    u.uLens.value = s.lens;
    u.uLensR.value = 70 * dpr;
    u.uMouse.value.set((pointer.cx - rect.left) * dpr, (rect.bottom - pointer.cy) * dpr);
    u.uPxToUv.value.set(1 / ((pw / W) * rect.width * dpr), 1 / ((ph / H) * rect.height * dpr));
  });

  return (
    <mesh ref={mesh} renderOrder={10}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={portraitVertex}
        fragmentShader={portraitFragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function Portrait() {
  const [asset, setAsset] = useState<{ texture: THREE.Texture; alpha: AlphaMap } | null>(null);

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(PHOTO.src, (texture) => {
      const img = texture.image as HTMLImageElement;
      // Raw sRGB sampling: the shader grades and outputs colour directly.
      texture.colorSpace = THREE.NoColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const cx = c.getContext("2d", { willReadFrequently: true })!;
      cx.drawImage(img, 0, 0);
      const alpha = { w: img.width, h: img.height, data: cx.getImageData(0, 0, img.width, img.height).data };
      if (alive) setAsset({ texture, alpha });
    });
    return () => {
      alive = false;
    };
  }, []);

  return asset ? <PortraitMesh texture={asset.texture} alpha={asset.alpha} /> : null;
}

/* ------------------------------------------------------------------ */
/* Canvas shell                                                        */
/* ------------------------------------------------------------------ */
class GLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function HeroCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [quality] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
      ? { detail: 22, particles: 450 }
      : { detail: 52, particles: 1400 },
  );
  usePointerTracking();

  // Stop rendering when the hero is off-screen.
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (!entry.isIntersecting) cursorBus.lens = false;
      },
      { rootMargin: "100px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // No WebGL: a CSS aura and the plain photo, same composition.
  const fallback = (
    <>
      <div className="absolute left-1/2 top-[38%] size-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffb38a,#ff5a1f_35%,#3b0d02_70%,transparent_72%)] opacity-70 blur-[2px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={PHOTO.src}
        alt=""
        className="absolute left-1/2 top-[6%] h-[122%] max-w-none -translate-x-1/2 grayscale"
      />
    </>
  );

  return (
    <div ref={wrap} className="pointer-events-none absolute inset-0">
      <GLBoundary fallback={fallback}>
        <Canvas
          camera={{ position: [0, 0, 6], fov: 35 }}
          dpr={[1, 1.75]}
          resize={{ offsetSize: true }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          frameloop={active ? "always" : "never"}
        >
          <Particles count={quality.particles} />
          <Blob detail={quality.detail} />
          <Portrait />
        </Canvas>
      </GLBoundary>
    </div>
  );
}
