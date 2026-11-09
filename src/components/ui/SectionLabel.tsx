"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** "(01) ———————— About" row that draws in on scroll. */
export default function SectionLabel({ index, title }: { index: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: ref.current, start: "top 90%", once: true } });
      tl.from("[data-sl-line]", { scaleX: 0, duration: 1.6, ease: "expo.inOut" }).from(
        "[data-sl-text]",
        { yPercent: 110, duration: 1, stagger: 0.08 },
        0.2,
      );
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="mb-[clamp(3rem,6vw,5.5rem)] flex items-center gap-4">
      <span className="overflow-hidden">
        <span data-sl-text className="mono block text-mute">
          ({index})
        </span>
      </span>
      <span data-sl-line className="hairline flex-1" />
      <span className="overflow-hidden">
        <span data-sl-text className="mono block text-mute">
          {title}
        </span>
      </span>
    </div>
  );
}
