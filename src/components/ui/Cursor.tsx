"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { cursorBus } from "@/lib/store";

/**
 * Cursor system
 * ─────────────
 * • default  – a liquid dot that squashes & stretches along its velocity, with an ember trail.
 * • link     – grows into an inverting lens over any link/button.
 * • stick    – `data-cursor-stick`: morphs into a pill around the element and pulls it magnetically.
 * • label    – `data-cursor="View project"`: glass disc with an accent core and rotating ring text.
 * • lens     – over the hero portrait: a hollow ring that frames the WebGL colour-reveal lens.
 * Pointer-fine devices only; touch devices keep the native behaviour.
 */
type Mode = "default" | "link" | "stick" | "label";

const RING_LEN = 2 * Math.PI * 52;

export default function Cursor() {
  const blob = useRef<HTMLDivElement>(null);
  const labelWrap = useRef<HTMLDivElement>(null);
  const labelInner = useRef<HTMLDivElement>(null);
  const ringText = useRef<SVGTextPathElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    const b = blob.current!;
    const lw = labelWrap.current!;
    const li = labelInner.current!;
    const cv = trail.current!;
    const ctx = cv.getContext("2d")!;

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...mouse };
    const lab = { ...mouse, tilt: 0 };
    const shape = { w: 14, h: 14, r: 7, sx: 1, sy: 1, angle: 0, fill: 1, ring: 0, o: 0 };
    const vel = { x: 0, y: 0, speed: 0 };
    const pts = Array.from({ length: 22 }, () => ({ ...mouse }));
    let trailAlpha = 0;
    let visible = false;
    let down = false;
    let mode: Mode = "default";
    let labelText = "";
    let stickEl: HTMLElement | null = null;
    const magnets = new Map<HTMLElement, { x: number; y: number; tx: number; ty: number }>();

    /* ---------- mode resolution ---------- */
    const setLabel = (text: string) => {
      if (text === labelText || !ringText.current) return;
      labelText = text;
      const unit = `${text.toUpperCase()} • `;
      ringText.current.textContent = unit.repeat(Math.max(1, Math.round(46 / unit.length)));
    };

    const setMode = (next: Mode) => {
      if (next === mode) return;
      const wasLabel = mode === "label";
      mode = next;
      if (next === "label") {
        gsap.to(li, { scale: 1, rotate: 0, duration: 0.9, ease: "elastic.out(1, 0.55)", overwrite: true });
      } else if (wasLabel) {
        gsap.to(li, { scale: 0, rotate: -40, duration: 0.45, ease: "power3.out", overwrite: true });
      }
    };

    const release = () => {
      if (!stickEl) return;
      const m = magnets.get(stickEl);
      if (m) {
        m.tx = 0;
        m.ty = 0;
      }
      stickEl = null;
    };

    const resolve = (target: Element | null) => {
      const labelled = target?.closest<HTMLElement>("[data-cursor]");
      if (labelled?.dataset.cursor) {
        release();
        setLabel(labelled.dataset.cursor);
        return setMode("label");
      }
      const stick = target?.closest<HTMLElement>("[data-cursor-stick]");
      if (stick) {
        if (stick !== stickEl) {
          release();
          stickEl = stick;
          if (!magnets.has(stick)) magnets.set(stick, { x: 0, y: 0, tx: 0, ty: 0 });
        }
        return setMode("stick");
      }
      release();
      if (target?.closest("a, button, [role='button'], input, textarea, select")) return setMode("link");
      setMode("default");
    };

    /* ---------- events ---------- */
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!visible) {
        visible = true;
        pos.x = lab.x = mouse.x;
        pos.y = lab.y = mouse.y;
        pts.forEach((p) => {
          p.x = mouse.x;
          p.y = mouse.y;
        });
      }
    };
    const onOver = (e: PointerEvent) => resolve(e.target as Element | null);
    const onLeave = () => {
      visible = false;
    };
    const onDown = () => {
      down = true;
      const rip = document.createElement("span");
      rip.className = "c-ripple";
      rip.style.left = `${mouse.x}px`;
      rip.style.top = `${mouse.y}px`;
      document.body.appendChild(rip);
      gsap.fromTo(
        rip,
        { scale: 0.2, opacity: 1 },
        { scale: 1, opacity: 0, duration: 0.9, ease: "expo.out", onComplete: () => rip.remove() },
      );
    };
    const onUp = () => {
      down = false;
    };
    // Content scrolls under a still pointer without pointer events: re-resolve.
    let scrollQueued = false;
    const onScroll = () => {
      if (scrollQueued || !visible) return;
      scrollQueued = true;
      requestAnimationFrame(() => {
        scrollQueued = false;
        resolve(document.elementFromPoint(mouse.x, mouse.y));
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });

    /* ---------- frame loop ---------- */
    const tick = (_t: number, deltaMs: number) => {
      const f = Math.min(deltaMs, 50) / 16.667; // frames elapsed at 60fps
      const k = (v: number) => 1 - Math.pow(1 - v, f);

      if (stickEl && !stickEl.isConnected) {
        magnets.delete(stickEl);
        stickEl = null;
        setMode("default");
      }

      // Velocity (smoothed)
      const dx = mouse.x - pos.x;
      const dy = mouse.y - pos.y;
      vel.x += (dx - vel.x) * k(0.25);
      vel.y += (dy - vel.y) * k(0.25);
      vel.speed = Math.hypot(vel.x, vel.y);

      const lens = mode === "default" && cursorBus.lens;

      // Target shape per mode
      let tx = mouse.x;
      let ty = mouse.y;
      let tw = 14;
      let th = 14;
      let fill = 1;
      let ring = 0;
      let follow = 0.3;

      if (mode === "link") {
        tw = th = 64;
        follow = 0.2;
      } else if (mode === "label") {
        tw = th = 0;
      } else if (lens) {
        tw = th = 140;
        fill = 0;
        ring = 1;
        follow = 0.35;
      } else if (mode === "stick" && stickEl) {
        const r = stickEl.getBoundingClientRect();
        const m = magnets.get(stickEl)!;
        const cx = r.left - m.x + r.width / 2;
        const cy = r.top - m.y + r.height / 2;
        m.tx = gsap.utils.clamp(-10, 10, (mouse.x - cx) * 0.22);
        m.ty = gsap.utils.clamp(-6, 6, (mouse.y - cy) * 0.22);
        tx = cx + (mouse.x - cx) * 0.12;
        ty = cy + (mouse.y - cy) * 0.12;
        tw = r.width + 24;
        th = r.height + 14;
        follow = 0.28;
      }
      if (down) {
        tw *= mode === "stick" ? 0.94 : 0.7;
        th *= mode === "stick" ? 0.94 : 0.7;
      }

      pos.x += (tx - pos.x) * k(follow);
      pos.y += (ty - pos.y) * k(follow);
      shape.w += (tw - shape.w) * k(0.2);
      shape.h += (th - shape.h) * k(0.2);
      shape.r = Math.min(shape.w, shape.h) / 2;
      shape.fill += (fill - shape.fill) * k(0.2);
      shape.ring += (ring - shape.ring) * k(0.2);
      shape.o += ((visible ? 1 : 0) - shape.o) * k(0.15);

      // Squash & stretch along the direction of travel
      const stretch = mode === "default" && !lens ? Math.min(vel.speed / 60, 0.55) : 0;
      if (vel.speed > 0.6) shape.angle = Math.atan2(vel.y, vel.x);
      shape.sx += (1 + stretch - shape.sx) * k(0.3);
      shape.sy += (1 - stretch * 0.45 - shape.sy) * k(0.3);

      b.style.width = `${shape.w}px`;
      b.style.height = `${shape.h}px`;
      b.style.borderRadius = `${shape.r}px`;
      b.style.opacity = String(shape.o);
      b.style.backgroundColor = `rgba(255,255,255,${shape.fill})`;
      b.style.boxShadow = `inset 0 0 0 ${shape.ring * 1.2}px rgba(255,255,255,${shape.ring})`;
      b.style.transform = `translate3d(${pos.x - shape.w / 2}px, ${pos.y - shape.h / 2}px, 0) rotate(${shape.angle}rad) scale(${shape.sx}, ${shape.sy}) rotate(${-shape.angle}rad)`;

      // Label disc: lags behind, tilts with horizontal speed
      lab.x += (mouse.x - lab.x) * k(0.16);
      lab.y += (mouse.y - lab.y) * k(0.16);
      lab.tilt += (gsap.utils.clamp(-18, 18, (mouse.x - lab.x) * 0.25) - lab.tilt) * k(0.15);
      lw.style.opacity = String(shape.o);
      lw.style.transform = `translate3d(${lab.x}px, ${lab.y}px, 0) rotate(${lab.tilt}deg)`;

      // Magnetic elements ease toward / back from the pointer
      magnets.forEach((m, el) => {
        m.x += (m.tx - m.x) * k(0.18);
        m.y += (m.ty - m.y) * k(0.18);
        if (el !== stickEl && Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05) {
          el.style.translate = "";
          magnets.delete(el);
          return;
        }
        el.style.translate = `${m.x.toFixed(2)}px ${m.y.toFixed(2)}px`;
      });

      // Ember trail
      pts[0].x += (pos.x - pts[0].x) * k(0.6);
      pts[0].y += (pos.y - pts[0].y) * k(0.6);
      for (let i = 1; i < pts.length; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * k(0.45);
        pts[i].y += (pts[i - 1].y - pts[i].y) * k(0.45);
      }
      const wantTrail = !reduce && visible && mode === "default" && !lens ? gsap.utils.clamp(0, 1, (vel.speed - 3) / 30) : 0;
      trailAlpha += (wantTrail - trailAlpha) * k(0.12);
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (trailAlpha > 0.01) {
        ctx.lineCap = "round";
        for (let i = 1; i < pts.length; i++) {
          const t = 1 - i / pts.length;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
          ctx.lineTo(pts[i].x, pts[i].y);
          ctx.lineWidth = 5 * t;
          ctx.strokeStyle = `rgba(255,90,31,${(trailAlpha * t * 0.85).toFixed(3)})`;
          ctx.stroke();
        }
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      root.classList.remove("has-cursor");
      magnets.forEach((_, el) => (el.style.translate = ""));
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden>
      <canvas ref={trail} className="c-trail" />
      <div ref={blob} className="c-blob" />
      <div ref={labelWrap} className="c-label">
        <div ref={labelInner} className="c-label-inner">
          <svg className="c-label-ring" viewBox="0 0 128 128">
            <defs>
              <path id="c-ring-path" d="M64,64 m-52,0 a52,52 0 1,1 104,0 a52,52 0 1,1 -104,0" />
            </defs>
            <text>
              <textPath ref={ringText} href="#c-ring-path" textLength={RING_LEN} lengthAdjust="spacing" />
            </text>
          </svg>
          <span className="c-label-core">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M7 17L17 7M9 7h8v8" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
