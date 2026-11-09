"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { heroState, usePageReady } from "@/lib/store";

const HeroCanvas = dynamic(() => import("@/components/three/HeroCanvas"), { ssr: false });

const NAME_SIZE = "clamp(5.5rem, 29.4vw, 34rem)";

/**
 * Three depth layers:
 *   0 · role line + giant name   (behind)
 *   1 · WebGL: particles, iridescent aura, portrait   (middle)
 *   2 · editorial UI             (front)
 * so the portrait stands in front of the name, magazine-cover style.
 */
export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const ready = usePageReady();

  // Scroll-linked state for the WebGL scene + parallax.
  useGSAP(
    () => {
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          heroState.progress = self.progress;
        },
      });
      gsap.to("[data-hero-back]", {
        yPercent: 22,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to("[data-hero-fade-out]", {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "40% top", scrub: true },
      });
      return () => {
        st.kill();
        heroState.progress = 0;
      };
    },
    { scope: root },
  );

  // Intro choreography.
  useGSAP(
    () => {
      if (!ready) return;
      const split = SplitText.create("[data-hero-title]", { type: "chars", mask: "chars" });
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from(split.chars, { yPercent: 105, duration: 1.7, stagger: 0.07, ease: "expo.out" })
        .from("[data-hero-in]", { yPercent: 110, duration: 1.2, stagger: 0.06 }, 0.5)
        .from("[data-hero-rule]", { scaleX: 0, duration: 1.8, ease: "expo.inOut" }, 0.3)
        .from("[data-hero-scroll-line]", { scaleY: 0, duration: 1.4, ease: "expo.inOut" }, 1);
      return () => split.revert();
    },
    { dependencies: [ready], scope: root },
  );

  return (
    <section ref={root} className="relative h-[100svh] min-h-[640px] overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] size-[100vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,90,31,0.2), rgba(90,70,255,0.08) 45%, transparent 70%)" }}
      />

      {/* Layer 0 — behind the portrait */}
      <div data-hero-back className="px-gutter absolute inset-x-0 bottom-0 pb-[clamp(0.5rem,1.5vw,1.25rem)]">
        {/* On phones the portrait covers this line, so it moves to the top layer instead. */}
        <div className="mb-3 hidden items-end justify-between gap-6 md:mb-1 md:flex">
          <div className="overflow-hidden">
            <p data-hero-in className="text-[clamp(1.05rem,2.6vw,2.6rem)] font-medium leading-none tracking-[-0.04em]">
              Software Engineer
            </p>
          </div>
          <div className="overflow-hidden">
            <p data-hero-in className="text-right text-[clamp(1.05rem,2.6vw,2.6rem)] font-medium leading-none tracking-[-0.04em]">
              <span className="serif text-accent">&amp;</span> Web Developer
            </p>
          </div>
        </div>
        <div data-hero-rule className="hairline mb-2 origin-left" />
        <h1>
          <span className="sr-only">Ahmad — Software Engineer and Web Developer</span>
          <span
            aria-hidden
            data-hero-title
            className="block whitespace-nowrap text-center font-medium leading-[0.8] tracking-[-0.075em]"
            style={{ fontSize: NAME_SIZE, marginLeft: "-0.03em" }}
          >
            AHMAD
          </span>
        </h1>
      </div>

      {/* Layer 1 — WebGL */}
      <HeroCanvas />

      {/* Layer 2 — editorial UI */}
      <div data-hero-fade-out className="px-gutter pointer-events-none absolute inset-x-0 top-0 pt-24 md:pt-28">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 overflow-hidden md:col-span-3">
            <p data-hero-in className="mono hidden text-mute md:block">
              (Portfolio)
              <br />
              Selected work 2024—26
            </p>
            <p data-hero-in className="text-[1.6rem] font-medium leading-[1.05] tracking-[-0.04em] md:hidden">
              Software Engineer
              <br />
              <span className="serif text-accent">&amp;</span> Web Developer
            </p>
          </div>
          <div className="col-span-12 overflow-hidden md:col-span-4 md:col-start-9">
            <p data-hero-in className="max-w-[22rem] text-[clamp(0.95rem,1.2vw,1.12rem)] leading-snug text-bone/80">
              Computer Science student building <span className="serif text-bone">AI-integrated</span> web
              applications and production websites — from Jakarta.
            </p>
          </div>
        </div>
      </div>

      <div
        data-hero-fade-out
        className="px-gutter pointer-events-none absolute inset-x-0 top-[44%] hidden -translate-y-1/2 items-center justify-between md:flex"
      >
        <div className="flex items-center gap-4">
          <span className="relative block h-16 w-px overflow-hidden bg-line">
            <span data-hero-scroll-line className="absolute inset-0 origin-top">
              <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.2s_var(--ease-in-out)_infinite] bg-accent" />
            </span>
          </span>
          <span className="overflow-hidden">
            <span data-hero-in className="mono block text-mute">
              Scroll
              <br />
              to explore
            </span>
          </span>
        </div>

        <div className="overflow-hidden text-right">
          <div data-hero-in>
            <p className="mono flex items-center justify-end gap-2 text-accent">
              <span className="text-[0.9rem] leading-none">✦</span> 3rd Place — EXASTI 2.0
            </p>
            <p className="mono mt-1.5 text-mute">
              Web App Competition
              <br />
              06°10′S — 106°49′E
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
