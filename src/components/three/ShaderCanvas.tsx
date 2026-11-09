"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { fbm2D, hexToRgb } from "./glsl";

const vertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragment = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform float uSeed;
uniform float uWarp;
varying vec2 vUv;

${fbm2D}

void main(){
  vec2 uv = vUv;
  vec2 p = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.4;
  float t = uTime * 0.07;

  // Pointer lens: gently pull the field toward the cursor.
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 2.4;
  float lens = exp(-dot(p - m, p - m) * 1.4);
  p -= (p - m) * lens * 0.35 * uWarp;

  // Domain-warped fbm (Inigo Quilez)
  vec2 q = vec2(fbm(p + uSeed + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(
    fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 1.6),
    fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 1.2)
  );
  float f = fbm(p + 3.0 * r + uSeed);

  vec3 col = mix(uC3, uC1, clamp(f * f * 2.6, 0.0, 1.0));
  col = mix(col, uC2, clamp(pow(length(q), 2.0) * 0.9, 0.0, 1.0) * smoothstep(0.45, 0.95, f));
  col = mix(col, uC3, clamp(r.y * r.y * 1.3, 0.0, 1.0) * 0.55);

  // Fine iridescent sheen along the flow lines
  float lines = smoothstep(0.0, 0.02, abs(fract(f * 9.0 + t) - 0.5) - 0.46);
  col += uC2 * (1.0 - lines) * 0.06;

  col += lens * uC2 * 0.12 * uWarp;
  col *= 1.0 - 0.45 * pow(length(uv - 0.5) * 1.25, 2.0);   // vignette
  col += (hash21(uv * uRes + fract(uTime * 7.0)) - 0.5) * 0.05;  // film grain

  gl_FragColor = vec4(col, 1.0);
}
`;

type Colors = [string, string, string];

type MouseRef = { current: { x: number; y: number } };

function Plane({ colors, seed, mouse }: { colors: Colors; seed: number; mouse: MouseRef }) {
  const { size, gl } = useThree();
  const target = useRef(colors.map(hexToRgb));
  const smoothMouse = useRef({ x: 0.5, y: 0.5, warp: 0 });
  const mat = useRef<THREE.ShaderMaterial>(null);
  const clock = useRef(10 + seed * 13.7);

  // Initial uniforms; per-frame updates go through the material ref.
  const [initial] = useState(() => ({
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uC1: { value: new THREE.Vector3(...hexToRgb(colors[0])) },
    uC2: { value: new THREE.Vector3(...hexToRgb(colors[1])) },
    uC3: { value: new THREE.Vector3(...hexToRgb(colors[2])) },
    uSeed: { value: seed },
    uWarp: { value: 0 },
  }));

  useEffect(() => {
    target.current = colors.map(hexToRgb);
  }, [colors]);

  useFrame((_, delta) => {
    const uniforms = mat.current?.uniforms;
    if (!uniforms) return;
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    uniforms.uTime.value = clock.current;
    uniforms.uSeed.value = seed;
    const dpr = gl.getPixelRatio();
    uniforms.uRes.value.set(size.width * dpr, size.height * dpr);

    // Ease colours toward the current target (smooth crossfade between projects).
    const keys = ["uC1", "uC2", "uC3"] as const;
    keys.forEach((k, i) => {
      const [r, g, b] = target.current[i];
      const v = uniforms[k].value;
      v.x = THREE.MathUtils.damp(v.x, r, 4, dt);
      v.y = THREE.MathUtils.damp(v.y, g, 4, dt);
      v.z = THREE.MathUtils.damp(v.z, b, 4, dt);
    });

    const s = smoothMouse.current;
    const { x, y } = mouse.current;
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    s.x = THREE.MathUtils.damp(s.x, inside ? x : 0.5, 3, dt);
    s.y = THREE.MathUtils.damp(s.y, inside ? y : 0.5, 3, dt);
    s.warp = THREE.MathUtils.damp(s.warp, inside ? 1 : 0, 2.5, dt);
    uniforms.uMouse.value.set(s.x, s.y);
    uniforms.uWarp.value = s.warp;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={initial} depthTest={false} />
    </mesh>
  );
}

/**
 * Full-bleed generative gradient. Each project gets its own palette + seed,
 * which doubles as an abstract "cover image".
 */
export default function ShaderCanvas({
  colors,
  seed = 0,
  className = "",
}: {
  colors: Colors;
  seed?: number;
  className?: string;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -1, y: -1 });
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouse.current.x = (e.clientX - r.left) / r.width;
      mouse.current.y = 1 - (e.clientY - r.top) / r.height;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => {
      window.removeEventListener("pointermove", onMove);
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrap} className={className}>
      <Canvas
        dpr={[1, 1.5]}
        // Measure layout size, not transformed size: parents animate with scale().
        resize={{ offsetSize: true }}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        frameloop={active ? "always" : "never"}
        style={{ position: "absolute", inset: 0 }}
      >
        <Plane colors={colors} seed={seed} mouse={mouse} />
      </Canvas>
    </div>
  );
}
