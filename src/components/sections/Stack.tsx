"use client";

import { Fragment, useEffect, useRef } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import { gsap } from "@/lib/gsap";
import { stack } from "@/lib/data";

/**
 * Infinite marquee rows whose speed and skew respond to scroll velocity.
 * Scrolling down pushes rows forward; scrolling up reverses them.
 */
export default function Stack() {
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = rows.current.map(() => ({ x: 0 }));
    let lastY = window.scrollY;
    let velocity = 0;
    let direction = 1;

    const tick = (_t: number, dt: number) => {
      const y = window.scrollY;
      const raw = (y - lastY) / Math.max(dt, 1);
      lastY = y;
      velocity += (raw - velocity) * 0.12;
      if (Math.abs(raw) > 0.05) direction = raw > 0 ? 1 : -1;

      rows.current.forEach((el, i) => {
        if (!el) return;
        const half = el.scrollWidth / 2;
        const base = reduce ? 0 : 0.045 * dt;
        const boost = Math.abs(velocity) * dt * 0.5;
        const sign = (i % 2 === 0 ? -1 : 1) * direction;
        const s = state[i];
        s.x += (base + boost) * sign;
        if (s.x <= -half) s.x += half;
        if (s.x > 0) s.x -= half;
        const skew = gsap.utils.clamp(-8, 8, velocity * -2.2);
        el.style.transform = `translate3d(${s.x}px,0,0) skewX(${skew}deg)`;
      });
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section className="relative overflow-hidden py-[clamp(5rem,10vw,9rem)]">
      <div className="px-gutter">
        <SectionLabel index="05" title="Toolbox" />
      </div>
      <div className="space-y-2 md:space-y-4" aria-label="Technical skills">
        {stack.map((row, r) => (
          <div key={r} className="overflow-hidden border-y border-line py-3 md:py-5">
            <div
              ref={(el) => {
                rows.current[r] = el;
              }}
              className="marquee-track"
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
                  {row.map((s, i) => (
                    <Fragment key={s + copy}>
                      <span
                        className={`whitespace-nowrap px-[clamp(1rem,2.5vw,2.5rem)] text-[clamp(2.75rem,7.5vw,8rem)] leading-none tracking-[-0.05em] ${
                          (i + r) % 3 === 1 ? "serif text-bone/90" : "font-medium"
                        }`}
                      >
                        {s}
                      </span>
                      <span className="text-[clamp(1rem,2vw,2rem)] text-accent">✦</span>
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
