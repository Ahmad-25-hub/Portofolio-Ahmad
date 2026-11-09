"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type Variant = "diamond" | "signal";

const ACCENT = "#ff5a1f";
const BONE = "rgba(236,232,225,0.9)";
const RULE = "rgba(236,232,225,0.35)";

/** Is pixel (col,row) lit? `rows` is the band height in cells; patterns are centred on it. */
function lit(variant: Variant, col: number, row: number, rows: number, t: number): 0 | 1 | 2 {
  const mid = (rows - 1) / 2;
  if (variant === "diamond") {
    const P = 22;
    const c = (((col % P) + P) % P) - P / 2;
    const r = row - mid;
    const d = Math.abs(c) + Math.abs(r);
    if (d === 4 || d <= 1) return 1; // diamond ring + core
    if (Math.abs(c) >= P / 2 - 1 && Math.abs(r) <= 0.5) return 2; // spacer dot
    if (Math.abs(r) === mid - 1 && (col & 1) === 0) return 2; // dotted inner rules
    return 0;
  }
  // "signal": a continuous pixel waveform with a heartbeat spike every 48 columns.
  const y0 = signalY(col - 1, mid, t);
  const y1 = signalY(col, mid, t);
  if (row >= Math.min(y0, y1) && row <= Math.max(y0, y1)) return 1;
  if (row === Math.round(mid) && col % 4 === 0) return 2;
  return 0;
}

const SPIKE = [0, -1, -3, -4, -2, 2, 3, 1, 0];
function signalY(col: number, mid: number, t: number) {
  const local = ((col % 48) + 48) % 48;
  const spike = local < SPIKE.length ? SPIKE[local] : 0;
  return Math.round(mid + spike + (spike ? 0 : Math.sin(col * 0.16 + t * 1.4) * 1.2));
}

/**
 * Full-width pixel band drawn on canvas. Scrolls sideways; scrolling the page
 * speeds it up. Types itself in from the left when it enters the viewport.
 */
export default function PixelBand({ variant = "diamond", className = "" }: { variant?: Variant; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const CELL = 4;
    let w = 0;
    let h = 0;
    let cols = 0;
    let rows = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL) + 1;
      rows = Math.floor(h / CELL);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const state = { offset: 0, reveal: reduce ? 1 : 0, time: 0 };
    let visible = false;
    let lastY = window.scrollY;
    let boost = 0;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const shift = Math.floor(state.offset);
      const sub = (state.offset - shift) * CELL;
      const limit = Math.ceil(cols * state.reveal);
      // Top and bottom rules
      ctx.fillStyle = RULE;
      ctx.fillRect(0, 0, limit * CELL, 1);
      ctx.fillRect(0, h - 1, limit * CELL, 1);
      for (let c = 0; c < limit; c++) {
        for (let r = 1; r < rows - 1; r++) {
          const v = lit(variant, c + shift, r, rows, state.time);
          if (!v) continue;
          ctx.fillStyle = v === 1 ? ACCENT : BONE;
          ctx.fillRect(c * CELL - sub, r * CELL + (h - rows * CELL) / 2, CELL - 1, CELL - 1);
        }
      }
    };

    const tick = (_t: number, dtMs: number) => {
      if (!visible) return;
      const dt = Math.min(dtMs, 50) / 1000;
      const y = window.scrollY;
      boost += (Math.abs(y - lastY) * 0.6 - boost) * 0.1;
      lastY = y;
      if (!reduce) {
        state.offset += (variant === "signal" ? 6 : 3) * dt + boost * dt;
        state.time += dt;
      }
      draw();
    };
    gsap.ticker.add(tick);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && state.reveal < 1) {
          gsap.to(state, { reveal: 1, duration: 1.6, ease: "power2.inOut" });
        }
      },
      { rootMargin: "50px" },
    );
    io.observe(el);
    draw();

    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      gsap.killTweensOf(state);
    };
  }, [variant]);

  return (
    <div ref={wrap} className={`relative h-11 w-full ${className}`} aria-hidden>
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
