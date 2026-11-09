"use client";

import { useCallback, useEffect, useRef } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import Clock from "@/components/ui/Clock";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { getLenis } from "@/lib/store";
import { navLinks, profile } from "@/lib/data";

const ITEMS = [{ label: "Home", href: "/" }, ...navLinks];

const ACCENT = "#ff5a1f";
const TINTS = ["#ff6a33", "#f04f16", "#ff7c4a", "#e8480f"];
const STREAK = "#ffd9c7";

/** One horizontal band of the flood. `from`: -1 left, 1 right, 0 both edges meeting at `split`. */
type Row = { y: number; h: number; from: -1 | 0 | 1; split: number; delay: number; dur: number; tint: string };

const ease = gsap.parseEase("power3.inOut");

/**
 * Full-screen menu. Opening floods the screen with horizontal accent bands that
 * race in from both edges at random lengths, then the links rise out of masks.
 * Closing reverses it: content drops out, bands retract to where they came from.
 */
export default function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const flood = useRef({ t: 0, total: 1, rows: [] as Row[], w: 0, h: 0 });
  const tl = useRef<gsap.core.Timeline | null>(null);
  const wasOpen = useRef(false);

  const draw = useCallback(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const { t, total, rows, w, h } = flood.current;
    ctx.clearRect(0, 0, w, h);
    const now = t * total;
    for (const r of rows) {
      const raw = Math.min(1, Math.max(0, (now - r.delay) / r.dur));
      if (raw <= 0) continue;
      if (raw >= 1) {
        // Settled: one solid band (no sub-pixel seam where split halves meet).
        ctx.fillStyle = ACCENT;
        ctx.fillRect(0, r.y, w, r.h);
        continue;
      }
      const p = ease(raw);
      ctx.fillStyle = r.tint;
      const streak = 6 + 34 * (1 - p);
      if (r.from === -1) {
        ctx.fillRect(0, r.y, p * w, r.h);
        if (streak) {
          ctx.fillStyle = STREAK;
          ctx.fillRect(p * w - streak, r.y, streak, r.h);
        }
      } else if (r.from === 1) {
        ctx.fillRect(w - p * w, r.y, p * w, r.h);
        if (streak) {
          ctx.fillStyle = STREAK;
          ctx.fillRect(w - p * w, r.y, streak, r.h);
        }
      } else {
        const left = p * r.split * w;
        const right = p * (1 - r.split) * w;
        ctx.fillRect(0, r.y, left, r.h);
        ctx.fillRect(w - right, r.y, right, r.h);
        if (streak) {
          ctx.fillStyle = STREAK;
          ctx.fillRect(left - streak, r.y, streak, r.h);
          ctx.fillRect(w - right, r.y, streak, r.h);
        }
      }
    }
  }, []);

  const setup = useCallback(() => {
    const cv = canvas.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    cv.width = w * dpr;
    cv.height = h * dpr;
    cv.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);

    const rowH = Math.max(10, Math.min(18, h / 52));
    const n = Math.ceil(h / rowH);
    const rows: Row[] = [];
    for (let i = 0; i < n; i++) {
      const r = Math.random();
      rows.push({
        y: i * rowH,
        h: rowH + 0.6, // overlap: no hairline seams between bands
        from: r < 0.42 ? -1 : r < 0.84 ? 1 : 0,
        split: 0.25 + Math.random() * 0.5,
        delay: Math.random() * 0.36 + (i / n) * 0.14,
        dur: 0.3 + Math.random() * 0.32,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
      });
    }
    flood.current = { ...flood.current, rows, w, h, total: Math.max(...rows.map((r) => r.delay + r.dur)) };
  }, []);

  // Open / close choreography.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const q = (s: string) => el.querySelectorAll(s);
    const reduce = prefersReducedMotion();

    if (open) {
      wasOpen.current = true;
      tl.current?.kill();
      getLenis()?.stop();
      setup();
      el.inert = false;
      const f = flood.current;
      tl.current = gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .fromTo(f, { t: 0 }, { t: 1, duration: reduce ? 0.01 : f.total, ease: "none", onUpdate: draw }, 0)
        .fromTo(
          q("[data-mo-line]"),
          { scaleX: 0, transformOrigin: "0% 50%" },
          { scaleX: 1, duration: 1.1, ease: "expo.inOut", stagger: 0.05 },
          0.25,
        )
        .fromTo(q("[data-mo-in]"), { yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.05 }, 0.32)
        .fromTo(q("[data-mo-fade]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05 }, 0.55)
        .add(() => closeBtn.current?.focus({ preventScroll: true }), 0.4);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      tl.current?.kill();
      getLenis()?.start();
      const f = flood.current;
      tl.current = gsap
        .timeline({
          onComplete: () => {
            gsap.set(el, { visibility: "hidden" });
            el.inert = true;
          },
        })
        .to(q("[data-mo-in]"), { yPercent: -115, duration: 0.45, ease: "power3.in", stagger: 0.02 }, 0)
        .to(q("[data-mo-fade]"), { opacity: 0, duration: 0.3 }, 0)
        .to(q("[data-mo-line]"), { scaleX: 0, transformOrigin: "100% 50%", duration: 0.55, ease: "power3.in" }, 0)
        .to(f, { t: 0, duration: reduce ? 0.01 : f.total * 0.85, ease: "none", onUpdate: draw }, 0.22);
    }
  }, [open, setup, draw]);

  // Esc to close; keep the flood full-screen on resize.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onResize = () => {
      const t = flood.current.t;
      setup();
      flood.current.t = t;
      draw();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open, onClose, setup, draw]);

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      className="invisible fixed inset-0 z-[70] text-ink"
      inert
    >
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />

      <div className="px-gutter relative flex h-full flex-col">
        {/* Top bar mirrors the header so the swap is seamless */}
        <div className="grid grid-cols-2 items-center gap-4 py-4 md:grid-cols-12">
          <div className="overflow-hidden md:col-span-3">
            <span data-mo-in className="block text-[0.95rem] font-medium tracking-tight">
              {profile.name}©
            </span>
          </div>
          <div className="hidden overflow-hidden md:col-span-6 md:block">
            <span data-mo-in className="mono block text-ink/60">
              Index — {String(ITEMS.length).padStart(2, "0")} destinations
            </span>
          </div>
          <div className="flex justify-end md:col-span-3">
            <button
              ref={closeBtn}
              type="button"
              onClick={onClose}
              data-cursor-stick
              className="btn-notch"
              style={{ "--btn-bg": ACCENT } as React.CSSProperties}
            >
              <span>Close</span>
              <span aria-hidden className="text-[0.9rem] leading-none">
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="grid flex-1 content-between gap-10 pb-6 md:grid-cols-12 md:content-stretch md:pb-8">
          <nav aria-label="Primary" className="flex flex-col justify-center md:col-span-8">
            <ol>
              {ITEMS.map((item, i) => (
                <li key={item.href} className="group relative">
                  <span data-mo-line aria-hidden className="absolute inset-x-0 top-0 h-px bg-ink/25" />
                  {/* Hover: an ink band floods in from the left behind the label */}
                  <span
                    aria-hidden
                    className="absolute inset-0 origin-left scale-x-0 bg-ink transition-transform duration-[650ms] ease-[var(--ease-out)] group-hover:scale-x-100"
                  />
                  <TransitionLink
                    href={item.href}
                    onClick={() => {
                      // Resume Lenis *before* navigate() scrolls: start() resets any
                      // in-flight scroll, so starting it later would cancel the jump.
                      getLenis()?.start();
                      onClose();
                    }}
                    className="relative flex items-center gap-4 py-[0.4vh] md:gap-8"
                  >
                    <span className="mono w-7 shrink-0 text-ink/60 transition-colors duration-300 group-hover:text-accent md:w-10">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="overflow-hidden">
                      <span data-mo-in className="block">
                        <span className="roll text-[min(11.5vh,15vw)] font-medium leading-[1] tracking-[-0.055em] transition-colors duration-300 group-hover:text-bone">
                          <span>{item.label}</span>
                          <span aria-hidden className="serif tracking-[-0.02em]">
                            {item.label}
                          </span>
                        </span>
                      </span>
                    </span>
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      fill="none"
                      className="ml-auto hidden size-[clamp(1.5rem,4vh,3rem)] -translate-x-4 text-accent opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </TransitionLink>
                </li>
              ))}
              <li aria-hidden className="relative">
                <span data-mo-line className="absolute inset-x-0 top-0 h-px bg-ink/25" />
              </li>
            </ol>
          </nav>

          <aside className="flex flex-col justify-end gap-8 md:col-span-3 md:col-start-10">
            <div>
              <p data-mo-fade className="mono mb-3 text-ink/60">
                Connect
              </p>
              <ul className="space-y-1.5 text-[1.05rem] tracking-tight">
                <li data-mo-fade>
                  <a href={`mailto:${profile.email}`} className="u-line [overflow-wrap:anywhere]">
                    {profile.email}
                  </a>
                </li>
                {profile.socials.map((s) => (
                  <li data-mo-fade key={s.label}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="u-line">
                      {s.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div data-mo-fade className="mono flex justify-between gap-4 text-ink/70">
              <span>Jakarta, ID</span>
              <Clock />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
