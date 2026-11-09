"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

// Dense, high-ink glyphs read as solid letterforms; thin ones are kept for texture.
const GLYPHS = "01#$&%@{}[]<>=+*8BW/\\".split("");
const BONE = "#ece8e1";
const ACCENT = "#ff5a1f";

type Cell = { x: number; y: number; g: number; on: boolean; heat: number; seed: number };

/**
 * A giant word typeset out of code glyphs on a canvas grid.
 * The pointer heats nearby cells: they scramble, glow accent and get pushed away.
 * A diagonal scan sweeps through every few seconds when idle.
 */
export default function GlyphName({ text = "AHMAD", className = "" }: { text?: string; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let cell = 10;
    let cells: Cell[] = [];
    let atlas: { bone: HTMLCanvasElement[]; accent: HTMLCanvasElement[] } = { bone: [], accent: [] };
    const pointer = { x: -9999, y: -9999, active: false };
    let visible = false;
    let scan = -1;
    let idle = 0;

    const makeAtlas = (dpr: number) => {
      const size = Math.ceil(cell * dpr);
      const font = `700 ${Math.round(cell * 1.05 * dpr)}px ${getComputedStyle(document.body).getPropertyValue("--font-geist-mono") || "monospace"}, ui-monospace, monospace`;
      const make = (color: string) =>
        GLYPHS.map((g) => {
          const c = document.createElement("canvas");
          c.width = c.height = size;
          const x = c.getContext("2d")!;
          x.font = font;
          x.fillStyle = color;
          x.textAlign = "center";
          x.textBaseline = "middle";
          x.fillText(g, size / 2, size / 2 + dpr * 0.5);
          return c;
        });
      atlas = { bone: make(BONE), accent: make(ACCENT) };
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = Math.max(7, Math.min(13, w / 120));
      makeAtlas(dpr);

      // Rasterise the word into a mask that fills the box edge to edge.
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const m = mask.getContext("2d", { willReadFrequently: true })!;
      const family = getComputedStyle(document.body).fontFamily;
      let size = h / 0.74;
      m.font = `700 ${size}px ${family}`;
      const tw = m.measureText(text).width;
      if (tw > w * 0.995) size *= (w * 0.995) / tw;
      m.font = `700 ${size}px ${family}`;
      m.textAlign = "center";
      m.textBaseline = "alphabetic";
      m.fillStyle = "#fff";
      const metrics = m.measureText(text);
      const capH = metrics.actualBoundingBoxAscent;
      m.fillText(text, w / 2, (h + capH) / 2);
      const data = m.getImageData(0, 0, w, h).data;

      const cols = Math.floor(w / cell);
      const rows = Math.floor(h / cell);
      const ox = (w - cols * cell) / 2;
      const oy = (h - rows * cell) / 2;
      cells = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = ox + c * cell;
          const y = oy + r * cell;
          const sx = Math.min(w - 1, Math.floor(x + cell / 2));
          const sy = Math.min(h - 1, Math.floor(y + cell / 2));
          const on = data[(sy * w + sx) * 4 + 3] > 128;
          cells.push({ x, y, g: Math.floor(Math.random() * GLYPHS.length), on, heat: 0, seed: Math.random() });
        }
      }
      draw(0);
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const R = Math.max(90, w * 0.09);
      const scanPos = scan;
      for (const k of cells) {
        const cx = k.x + cell / 2;
        const cy = k.y + cell / 2;
        if (!k.on) {
          // Faint matrix dots outside the letters
          ctx.fillStyle = "rgba(236,232,225,0.07)";
          ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
          continue;
        }
        // Heat from pointer + idle scan line
        let target = 0;
        if (pointer.active) {
          const d = Math.hypot(cx - pointer.x, cy - pointer.y);
          if (d < R) target = 1 - d / R;
        }
        if (scanPos >= 0) {
          const s = Math.abs(cx + cy * 0.6 - scanPos);
          if (s < 40) target = Math.max(target, (1 - s / 40) * 0.8);
        }
        k.heat += (target - k.heat) * Math.min(1, dt * 10);
        if (!reduce && (k.heat > 0.15 ? Math.random() < k.heat * 0.35 : Math.random() < 0.0015)) {
          k.g = Math.floor(Math.random() * GLYPHS.length);
        }

        let dx = 0;
        let dy = 0;
        if (k.heat > 0.01 && pointer.active) {
          const ang = Math.atan2(cy - pointer.y, cx - pointer.x);
          dx = Math.cos(ang) * k.heat * cell * 0.9;
          dy = Math.sin(ang) * k.heat * cell * 0.9;
        }
        const x = k.x + dx;
        const y = k.y + dy;
        ctx.globalAlpha = 1 - k.heat;
        ctx.drawImage(atlas.bone[k.g], x, y, cell, cell);
        if (k.heat > 0.02) {
          ctx.globalAlpha = Math.min(1, k.heat * 1.4);
          ctx.drawImage(atlas.accent[k.g], x, y, cell, cell);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (_t: number, dtMs: number) => {
      if (!visible) return;
      const dt = Math.min(dtMs, 50) / 1000;
      if (!reduce) {
        idle += dt;
        if (scan < 0 && idle > 3.5) {
          scan = -60;
          idle = 0;
        }
        if (scan >= -60) {
          scan += dt * (w + h) * 0.75;
          if (scan > w + h * 0.6 + 60) scan = -1;
        }
      }
      draw(dt);
    };

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = pointer.x > -150 && pointer.x < r.width + 150 && pointer.y > -150 && pointer.y < r.height + 150;
      if (pointer.active) idle = 0;
    };

    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    const ro = new ResizeObserver(() => build());
    ro.observe(el);
    window.addEventListener("pointermove", onMove, { passive: true });
    if (!reduce) gsap.ticker.add(tick);
    (document.fonts?.ready ?? Promise.resolve()).then(build);

    return () => {
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, [text]);

  return (
    <div ref={wrap} className={`relative w-full ${className}`}>
      <span className="sr-only">{text}</span>
      <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
    </div>
  );
}
