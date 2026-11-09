"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { usePageReady } from "@/lib/store";
import { profile, stats } from "@/lib/data";
import SectionLabel from "@/components/ui/SectionLabel";
import PortraitCard from "@/components/ui/PortraitCard";

export default function About() {
  const root = useRef<HTMLElement>(null);
  const ready = usePageReady();

  useGSAP(
    () => {
      if (!ready) return;
      // Word-by-word illumination, scrubbed with scroll.
      const split = SplitText.create("[data-manifesto]", { type: "words" });
      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: { trigger: "[data-manifesto]", start: "top 78%", end: "bottom 50%", scrub: true },
        },
      );

      // Counters
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = parseFloat(el.dataset.count ?? "0");
        const decimals = parseInt(el.dataset.decimals ?? "0", 10);
        const pad = parseInt(el.dataset.pad ?? "0", 10);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: end,
          duration: 2.2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => {
            const v = obj.v.toFixed(decimals);
            el.textContent = pad ? v.padStart(pad, "0") : v;
          },
        });
      });

      gsap.from("[data-stat]", {
        y: 60,
        opacity: 0,
        duration: 1.4,
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-stats]", start: "top 85%", once: true },
      });
      gsap.from("[data-stat-line]", {
        scaleX: 0,
        duration: 1.6,
        ease: "expo.inOut",
        stagger: 0.1,
        scrollTrigger: { trigger: "[data-stats]", start: "top 85%", once: true },
      });

      return () => split.revert();
    },
    { dependencies: [ready], scope: root },
  );

  return (
    <section id="about" ref={root} className="px-gutter relative py-[clamp(6rem,14vw,13rem)]">
      <SectionLabel index="01" title="About" />

      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="sticky top-24 space-y-6">
            <PortraitCard />
            <p className="mono pt-4 text-mute">Currently</p>
            <p className="max-w-[16rem] text-[0.95rem] leading-relaxed text-bone/70">
              {profile.education.degree} at {profile.education.school}. GPA {profile.education.gpa}.
            </p>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <span key={i} className="mono rounded-full border border-line px-3 py-1.5 text-bone/70">
                  {i}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          <p data-manifesto className="text-lede">
            I build web products that <span className="serif">think</span> — AI-integrated platforms, careful
            backends and interfaces that feel effortless. From four institutional websites for my faculty to an{" "}
            <span className="serif text-accent">award-winning</span> dashboard for small businesses, I care about
            software that is useful, tested and built to last.
          </p>

          <div data-stats className="mt-[clamp(4rem,8vw,7rem)] grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} data-stat>
                <div data-stat-line className="hairline mb-5" />
                <p className="flex items-start text-[clamp(3rem,6vw,5.5rem)] font-medium leading-none tracking-[-0.06em]">
                  <span
                    data-count={s.value}
                    data-decimals={s.decimals ?? 0}
                    data-pad={s.pad}
                    className="tabular-nums"
                  >
                    {s.decimals ? s.value.toFixed(s.decimals) : String(s.value).padStart(s.pad, "0")}
                  </span>
                  {s.suffix && <span className="serif ml-1 text-[0.5em] text-accent">{s.suffix}</span>}
                </p>
                <p className="mt-4 max-w-[14rem] text-[0.9rem] leading-snug text-bone/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
