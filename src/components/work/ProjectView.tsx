"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import Reveal from "@/components/ui/Reveal";
import RollText from "@/components/ui/RollText";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePageReady } from "@/lib/store";
import type { Project } from "@/lib/data";

const ShaderCanvas = dynamic(() => import("@/components/three/ShaderCanvas"), { ssr: false });

type Props = { project: Project; index: number; total: number; next: Project };

export default function ProjectView({ project, index, total, next }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const ready = usePageReady();

  useGSAP(
    () => {
      if (!ready) return;
      const tl = gsap.timeline({ delay: 0.1 });
      tl.from("[data-pj-in]", { yPercent: 110, duration: 1.2, stagger: 0.05 }, 0.2)
        .from("[data-pj-meta]", { y: 30, opacity: 0, duration: 1.2, stagger: 0.07 }, 0.5)
        .fromTo(
          "[data-pj-cover]",
          { clipPath: "inset(18% 12% 18% 12% round 8px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.8, ease: "expo.inOut" },
          0.35,
        );

      gsap.fromTo(
        "[data-pj-cover-inner]",
        { scale: 1.15 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: "[data-pj-cover]", start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      gsap.to("[data-pj-cover-title]", {
        yPercent: -40,
        ease: "none",
        scrollTrigger: { trigger: "[data-pj-cover]", start: "top bottom", end: "bottom top", scrub: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-pj-row]").forEach((row) => {
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 88%", once: true } })
          .from(row.querySelector("[data-pj-line]"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" })
          .from(row.querySelectorAll("[data-pj-fade]"), { y: 40, opacity: 0, duration: 1.2, stagger: 0.08 }, 0.2);
      });
    },
    { dependencies: [ready], scope: root },
  );

  const meta = [
    { k: "Year", v: project.year },
    { k: "Context", v: project.context },
    { k: "Team", v: project.team },
    { k: "Category", v: project.category },
  ];

  return (
    <div ref={root}>
      {/* Intro */}
      <section className="px-gutter pb-[clamp(3rem,6vw,5rem)] pt-32 md:pt-40">
        <div className="mb-10 flex items-center justify-between">
          <span className="overflow-hidden">
            <TransitionLink href="/#work" data-pj-in data-cursor-stick className="mono block text-mute hover:text-bone">
              <RollText>← All work</RollText>
            </TransitionLink>
          </span>
          <span className="overflow-hidden">
            <span data-pj-in className="mono block text-mute">
              Project {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </span>
        </div>

        <h1 className="overflow-hidden">
          <span
            data-pj-in
            className="block font-medium leading-[0.85] tracking-[-0.065em]"
            style={{ fontSize: "clamp(4rem, 14.5vw, 16rem)" }}
          >
            {project.title}
          </span>
        </h1>

        <div className="mt-8 grid gap-10 md:grid-cols-12">
          <div className="overflow-hidden md:col-span-6">
            <p data-pj-in className="serif text-[clamp(1.75rem,3.4vw,3.25rem)] leading-[1.05] text-bone/90">
              {project.tagline}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-6 md:col-span-6">
            {meta.map((m) => (
              <div key={m.k} data-pj-meta className="border-t border-line pt-3">
                <dt className="mono mb-1.5 text-mute">{m.k}</dt>
                <dd className="text-[0.98rem] leading-snug">{m.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {project.award && (
          <div data-pj-meta className="mt-10 inline-flex items-center gap-3 rounded-full border border-accent/40 bg-accent/10 px-4 py-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="mono text-accent">{project.award}</span>
          </div>
        )}
      </section>

      {/* Generative cover */}
      <section data-pj-cover className="relative h-[clamp(26rem,88vh,60rem)] overflow-hidden">
        <div data-pj-cover-inner className="absolute inset-0">
          <ShaderCanvas colors={project.colors} seed={index * 2.3 + 0.7} className="absolute inset-0" />
        </div>
        <div className="px-gutter pointer-events-none absolute inset-0 flex flex-col justify-between py-[var(--gutter)]">
          <div className="flex justify-between">
            <span className="mono text-bone/80">{project.category}</span>
            <span className="mono text-bone/80">{project.year}</span>
          </div>
          <p
            data-pj-cover-title
            className="serif text-center leading-none text-bone mix-blend-overlay"
            style={{ fontSize: "clamp(4rem, 16vw, 18rem)" }}
          >
            {project.title}
          </p>
          <div className="flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <span key={s} className="mono rounded-full bg-ink/30 px-3 py-1.5 text-bone backdrop-blur-md">
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="px-gutter py-[clamp(5rem,11vw,10rem)]">
        <div className="grid gap-10 md:grid-cols-12">
          <p className="mono text-mute md:col-span-3">(Overview)</p>
          <Reveal as="p" className="text-lede md:col-span-9">
            {project.overview}
          </Reveal>
        </div>
      </section>

      {/* Highlights */}
      <section className="px-gutter pb-[clamp(4rem,9vw,8rem)]">
        <div className="grid gap-10 md:grid-cols-12">
          <p className="mono text-mute md:col-span-3">(What I built)</p>
          <ol className="md:col-span-9">
            {project.highlights.map((h, i) => (
              <li key={h.title} data-pj-row>
                <div data-pj-line className="hairline" />
                <div className="grid gap-4 py-8 md:grid-cols-9 md:py-10">
                  <span data-pj-fade className="serif text-[2.5rem] leading-none text-accent md:col-span-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3
                    data-pj-fade
                    className="text-[clamp(1.6rem,2.8vw,2.6rem)] font-medium leading-[1.02] tracking-[-0.04em] md:col-span-4"
                  >
                    {h.title}
                  </h3>
                  <p data-pj-fade className="text-[1.05rem] leading-relaxed text-bone/65 md:col-span-4">
                    {h.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Metrics */}
      <section className="px-gutter pb-[clamp(5rem,11vw,10rem)]">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="hidden md:col-span-3 md:block" />
          {project.metrics.map((m) => (
            <div key={m.label} data-pj-row className="md:col-span-4 lg:col-span-4">
              <div data-pj-line className="hairline mb-6" />
              <p data-pj-fade className="text-[clamp(4.5rem,11vw,10rem)] font-medium leading-[0.85] tracking-[-0.07em]">
                {m.value}
              </p>
              <p data-pj-fade className="mono mt-4 text-mute">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Next project */}
      <section className="relative">
        <TransitionLink
          href={`/work/${next.slug}`}
          transitionLabel={next.title}
          data-cursor="Next project"
          className="group relative block overflow-hidden border-t border-line"
        >
          <div className="absolute inset-0 opacity-0 transition-opacity duration-1000 ease-[var(--ease-out)] group-hover:opacity-100">
            <ShaderCanvas colors={next.colors} seed={1.3} className="absolute inset-0" />
          </div>
          <div className="px-gutter relative py-[clamp(5rem,12vw,11rem)]">
            <p className="mono mb-6 text-mute transition-colors group-hover:text-bone">Next project →</p>
            <p
              className="font-medium leading-[0.85] tracking-[-0.065em] transition-transform duration-1000 ease-[var(--ease-out)] group-hover:translate-x-4"
              style={{ fontSize: "clamp(3.5rem, 12vw, 13rem)" }}
            >
              {next.title}
            </p>
            <p className="serif mt-4 text-[clamp(1.25rem,2vw,2rem)] text-bone/70">{next.tagline}</p>
          </div>
        </TransitionLink>
      </section>
    </div>
  );
}
