"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { usePageReady } from "@/lib/store";

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** What to split into before animating. */
  split?: "lines" | "words" | "chars";
  /** "scroll" waits for the element to enter the viewport, "load" plays on page reveal. */
  on?: "scroll" | "load";
  delay?: number;
  stagger?: number;
  duration?: number;
};

/** Masked text reveal powered by GSAP SplitText. */
export default function Reveal({
  children,
  as: Tag = "div",
  className = "",
  split = "lines",
  on = "scroll",
  delay = 0,
  stagger,
  duration = 1.25,
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const ready = usePageReady();

  useGSAP(
    () => {
      if (!ready || !ref.current) return;
      const type = split === "lines" ? "lines" : `lines,${split}`;
      const st = SplitText.create(ref.current, {
        type,
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          const targets = self[split];
          return gsap.from(targets, {
            yPercent: 115,
            duration,
            delay,
            ease: "expo.out",
            stagger: stagger ?? (split === "chars" ? 0.02 : split === "words" ? 0.03 : 0.09),
            scrollTrigger: on === "scroll" ? { trigger: ref.current, start: "top 88%", once: true } : undefined,
          });
        },
      });
      return () => st.revert();
    },
    { dependencies: [ready], scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
