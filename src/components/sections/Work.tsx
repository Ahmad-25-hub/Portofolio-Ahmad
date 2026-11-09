"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { projects } from "@/lib/data";

const ShaderCanvas = dynamic(() => import("@/components/three/ShaderCanvas"), { ssr: false });

/** Floating WebGL preview that follows the cursor over the project list. */
function HoverPreview({ active, index }: { active: boolean; index: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const project = projects[index];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- capability check must run on the client
    setEnabled(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!enabled || !el) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3" });
    let lastX = 0;
    const rotTo = gsap.quickTo(el, "rotate", { duration: 0.9, ease: "power3" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rotTo(gsap.utils.clamp(-8, 8, (e.clientX - lastX) * 0.4));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [enabled]);

  useEffect(() => {
    if (!box.current) return;
    // overwrite: a quick in→out must kill the longer "show" tween,
    // otherwise it finishes last and leaves the preview stuck on screen.
    gsap.to(box.current.querySelector("[data-pv-inner]"), {
      scale: active ? 1 : 0,
      opacity: active ? 1 : 0,
      duration: active ? 0.9 : 0.45,
      ease: active ? "expo.out" : "power3.out",
      overwrite: true,
    });
  }, [active]);

  useEffect(() => {
    if (!box.current || !active) return;
    gsap.fromTo(
      box.current.querySelectorAll("[data-pv-text]"),
      { yPercent: 110 },
      { yPercent: 0, duration: 0.8, stagger: 0.04, ease: "expo.out", overwrite: true },
    );
  }, [index, active]);

  if (!enabled) return null;

  return (
    <div ref={box} className="pointer-events-none fixed left-0 top-0 z-40 select-none" aria-hidden>
      <div
        data-pv-inner
        className="relative -ml-[11rem] -mt-[7.5rem] h-[15rem] w-[22rem] origin-center scale-0 overflow-hidden rounded-[4px] opacity-0"
      >
        {/* Constant seed: only the palette crossfades between projects. */}
        <ShaderCanvas colors={project.colors} seed={1.7} className="absolute inset-0" />
        <div className="absolute inset-0 flex flex-col justify-between p-4 text-bone">
          <div className="flex justify-between overflow-hidden">
            <span data-pv-text className="mono block">
              {project.category}
            </span>
            <span data-pv-text className="mono block">
              {project.year}
            </span>
          </div>
          <div className="overflow-hidden">
            <span data-pv-text className="serif block text-5xl leading-none">
              {project.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Work() {
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  /** Row under the pointer, or -1. */
  const [hover, setHover] = useState(-1);
  /** Last hovered row — keeps the preview's content stable while it fades out. */
  const [shown, setShown] = useState(0);

  // Single source of truth: resolve the hovered row from the pointer position
  // on every move and scroll (scrolling moves rows under a still pointer
  // without firing enter/leave), and clear it whenever the pointer leaves.
  useEffect(() => {
    let px = -1;
    let py = -1;
    const resolve = (target: Element | null) => {
      const rows = list.current ? Array.from(list.current.querySelectorAll("[data-work-row]")) : [];
      const row = target?.closest("[data-work-row]");
      const i = row ? rows.indexOf(row) : -1;
      setHover(i);
      if (i >= 0) setShown(i);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      resolve(e.target as Element | null);
    };
    const onScroll = () => {
      if (px >= 0) resolve(document.elementFromPoint(px, py));
    };
    const clear = () => {
      px = -1;
      setHover(-1);
    };
    const onVisibility = () => {
      if (document.hidden) clear();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", clear);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", clear);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-work-row]").forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: "top 92%", once: true } });
        tl.from(row.querySelector("[data-row-line]"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" }).from(
          row.querySelectorAll("[data-row-in]"),
          { yPercent: 110, duration: 1.2, stagger: 0.05 },
          0.15,
        );
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className="px-gutter relative py-[clamp(5rem,10vw,9rem)]">
      <SectionLabel index="02" title="Selected work" />

      <div className="mb-[clamp(3rem,6vw,6rem)] grid items-end gap-8 md:grid-cols-12">
        <Reveal as="h2" className="text-headline md:col-span-8">
          Selected <span className="serif">work</span>
        </Reveal>
        <div className="max-w-sm md:col-span-4 md:justify-self-end">
          <p className="mono mb-3 text-accent">({String(projects.length).padStart(2, "0")}) Projects</p>
          <Reveal as="p" className="text-[1rem] leading-relaxed text-bone/60">
            A few things I have designed, built and shipped — mostly AI-integrated web applications, plus real
            websites used every day.
          </Reveal>
        </div>
      </div>

      <ul ref={list} className="work-list">
        {projects.map((p, i) => (
          <li key={p.slug} data-work-row className="work-row relative">
            <div data-row-line className="hairline origin-left" />
            <TransitionLink
              href={`/work/${p.slug}`}
              transitionLabel={p.title}
              data-cursor="View project"
              className="grid grid-cols-12 items-center gap-4 py-[clamp(1.25rem,2.6vw,2.4rem)]"
            >
              <span className="col-span-2 overflow-hidden md:col-span-1">
                <span data-row-in className="mono block text-mute">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
              <span className="col-span-10 overflow-hidden md:col-span-6">
                <span data-row-in className="flex items-center gap-4">
                  <span className="work-title text-[clamp(2.4rem,6.4vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.055em]">
                    {p.title}
                  </span>
                  <svg className="work-arrow hidden size-[clamp(1.5rem,3vw,3rem)] text-accent md:block" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </span>
              </span>
              <span className="col-span-8 col-start-3 overflow-hidden md:col-span-3 md:col-start-auto">
                <span data-row-in className="block text-[0.95rem] leading-snug text-bone/60">
                  {p.tagline}
                  {p.award && (
                    <span className="mono mt-2 flex items-center gap-2 text-accent">
                      <span className="size-1.5 rounded-full bg-accent" /> Award winner
                    </span>
                  )}
                </span>
              </span>
              <span className="col-span-2 overflow-hidden text-right">
                <span data-row-in className="mono block text-mute">
                  {p.year}
                </span>
              </span>
              {/* Touch devices: colour swatch instead of the floating preview */}
              <span
                aria-hidden
                className="col-span-10 col-start-3 h-1 rounded-full md:hidden"
                style={{ background: `linear-gradient(90deg, ${p.colors[2]}, ${p.colors[0]}, ${p.colors[1]})` }}
              />
            </TransitionLink>
          </li>
        ))}
        <li aria-hidden className="hairline" />
      </ul>

      <HoverPreview active={hover >= 0} index={shown} />
    </section>
  );
}
