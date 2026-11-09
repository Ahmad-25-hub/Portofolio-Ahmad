"use client";

import { useRef } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { capabilities } from "@/lib/data";

/** Sticky stacked cards — each card settles back as the next one arrives. */
export default function Capabilities() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>("[data-cap-card]");
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        gsap.to(card.querySelector("[data-cap-inner]"), {
          scale: 0.92,
          filter: "brightness(0.35) blur(1.5px)",
          ease: "none",
          scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="px-gutter relative py-[clamp(5rem,10vw,9rem)]">
      <SectionLabel index="03" title="Capabilities" />

      <div className="mb-[clamp(3rem,6vw,5rem)] grid gap-8 md:grid-cols-12">
        <Reveal as="h2" className="text-headline md:col-span-8">
          What I <span className="serif">do</span>
        </Reveal>
      </div>

      <div className="relative">
        {capabilities.map((c, i) => (
          <div
            key={c.title}
            data-cap-card
            className="sticky mb-[8vh] last:mb-0"
            style={{ top: `calc(5.5rem + ${i * 1.75}rem)` }}
          >
            <article
              data-cap-inner
              className="relative grid min-h-[min(68vh,40rem)] origin-top grid-rows-[auto_1fr_auto] overflow-hidden rounded-[6px] border border-line bg-ink-2 p-[clamp(1.5rem,3.5vw,3.5rem)]"
            >
              {/* Accent glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-[20%] -top-[40%] size-[70vmin] rounded-full opacity-25 blur-3xl"
                style={{
                  background: `radial-gradient(circle, ${["#ff5a1f", "#7b5cff", "#2f7bff", "#3dff9a"][i % 4]}, transparent 65%)`,
                }}
              />
              <div className="relative flex items-start justify-between">
                <span className="mono text-mute">Capability</span>
                <span className="serif text-[clamp(3rem,7vw,7rem)] leading-none text-accent">0{i + 1}</span>
              </div>
              <div className="relative grid content-end gap-8 md:grid-cols-12">
                <h3 className="text-[clamp(2.2rem,5.5vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.05em] md:col-span-7">
                  {c.title}
                </h3>
                <p className="max-w-md self-end text-[1.05rem] leading-relaxed text-bone/65 md:col-span-5 md:justify-self-end">
                  {c.body}
                </p>
              </div>
              <div className="relative mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
                {c.tags.map((t) => (
                  <span key={t} className="mono rounded-full border border-line px-3 py-1.5 text-bone/70">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
