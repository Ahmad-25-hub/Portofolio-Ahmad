"use client";

import { useRef } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { gsap, useGSAP } from "@/lib/gsap";
import { experience } from "@/lib/data";

type Item = { period: string; role: string; org: string; body?: string };

function Group({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <p className="mono mb-6 text-mute">{title}</p>
      <ul>
        {items.map((it) => (
          <li key={it.role + it.org} data-exp-row className="group relative">
            <div data-exp-line className="hairline" />
            <div className="grid grid-cols-12 gap-4 py-6 transition-colors duration-500">
              <span data-exp-fade className="mono col-span-12 text-mute sm:col-span-3">
                {it.period}
              </span>
              {/* GSAP animates this wrapper; the children keep their own CSS hover transitions. */}
              <div data-exp-fade className="col-span-12 sm:col-span-9">
                <p className="text-[clamp(1.25rem,2vw,1.75rem)] font-medium leading-tight tracking-[-0.03em] transition-transform duration-700 ease-[var(--ease-out)] group-hover:translate-x-2">
                  {it.role}
                </p>
                <p className="serif mt-1 text-[1.15rem] text-bone/70">{it.org}</p>
                {it.body && <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-bone/55">{it.body}</p>}
              </div>
            </div>
            <span
              aria-hidden
              className="absolute left-0 top-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-x-100"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>("[data-exp-row]").forEach((row) => {
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 90%", once: true } })
          .from(row.querySelector("[data-exp-line]"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" })
          .from(row.querySelectorAll("[data-exp-fade]"), { y: 24, opacity: 0, duration: 1, stagger: 0.08 }, 0.2);
      });
    },
    { scope: root },
  );

  return (
    <section id="experience" ref={root} className="px-gutter relative py-[clamp(5rem,10vw,9rem)]">
      <SectionLabel index="04" title="Experience" />
      <Reveal as="h2" className="text-headline mb-[clamp(3rem,6vw,5rem)]">
        Experience <span className="serif">&amp; journey</span>
      </Reveal>
      <div className="grid gap-16 lg:grid-cols-2 lg:gap-12">
        <Group title="Work & Education" items={experience.work} />
        <Group title="Community & Organizations" items={experience.community} />
      </div>
    </section>
  );
}
