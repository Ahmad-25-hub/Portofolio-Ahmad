"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { getLenis, setPageReady } from "@/lib/store";

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const reduce = prefersReducedMotion();
    const el = root.current!;
    const counter = { v: 0 };

    const tl = gsap.timeline({ paused: true });
    tl.from(el.querySelectorAll("[data-pl-in]"), {
      yPercent: 110,
      duration: 1,
      stagger: 0.08,
      ease: "expo.out",
    })
      .to(
        counter,
        {
          v: 100,
          duration: reduce ? 0.4 : 2.1,
          ease: "power3.inOut",
          onUpdate: () => {
            if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
            if (bar.current) bar.current.style.transform = `scaleX(${counter.v / 100})`;
          },
        },
        0.2,
      )
      .to(el.querySelectorAll("[data-pl-in]"), {
        yPercent: -110,
        duration: 0.7,
        stagger: 0.04,
        ease: "power3.in",
      })
      .add(() => {
        setPageReady(true);
        getLenis()?.start();
        ScrollTrigger.refresh();
      }, "-=0.1")
      .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.2, ease: "expo.inOut" }, "<")
      .add(() => setDone(true));

    let cancelled = false;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 2500))]).then(() => {
      if (!cancelled) tl.play();
    });

    return () => {
      cancelled = true;
      tl.kill();
    };
  }, []);

  if (done) return null;

  return (
    <div ref={root} className="preloader px-gutter" aria-hidden>
      <div className="flex h-full flex-col justify-between py-[var(--gutter)]">
        <div className="flex justify-between">
          <span className="overflow-hidden">
            <span data-pl-in className="mono block text-mute">
              Portfolio — ©2026
            </span>
          </span>
          <span className="overflow-hidden">
            <span data-pl-in className="mono block text-mute">
              Jakarta, ID
            </span>
          </span>
        </div>

        <div className="overflow-hidden text-center">
          <span data-pl-in className="serif block text-[clamp(3.5rem,12vw,12rem)] leading-[0.9]">
            Ahmad
          </span>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <span className="overflow-hidden">
              <span
                data-pl-in
                ref={count}
                className="block font-mono text-[clamp(3rem,8vw,7rem)] leading-none tracking-tighter tabular-nums"
              >
                000
              </span>
            </span>
            <span className="overflow-hidden">
              <span data-pl-in className="mono block max-w-[16rem] text-right text-mute">
                Software Engineer
                <br />& Web Developer
              </span>
            </span>
          </div>
          <div className="mt-4 h-px w-full bg-line">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-accent" />
          </div>
        </div>
      </div>
    </div>
  );
}
