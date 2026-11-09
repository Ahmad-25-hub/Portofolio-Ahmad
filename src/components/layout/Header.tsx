"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TransitionLink from "@/components/ui/TransitionLink";
import RollText from "@/components/ui/RollText";
import Clock from "@/components/ui/Clock";
import { gsap, useGSAP } from "@/lib/gsap";
import { usePageReady } from "@/lib/store";
import { profile } from "@/lib/data";
import MenuOverlay from "./MenuOverlay";

export default function Header() {
  const bar = useRef<HTMLElement>(null);
  const ready = usePageReady();
  const [open, setOpen] = useState(false);
  const introduced = useRef(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    // Return keyboard focus to the trigger once the dialog closes.
    requestAnimationFrame(() => menuBtn.current?.focus({ preventScroll: true }));
  }, []);

  // Intro once, on first reveal.
  useGSAP(
    () => {
      if (!ready || introduced.current) return;
      introduced.current = true;
      gsap.from("[data-hd-in]", {
        yPercent: 120,
        duration: 1.2,
        stagger: 0.06,
        delay: 0.5,
        // Unclip after the intro so magnetic elements can move freely.
        onComplete: () => gsap.set("[data-hd-clip]", { overflow: "visible" }),
      });
    },
    { dependencies: [ready], scope: bar },
  );

  // Hide on scroll down, show on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    let hidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > last && y > 160;
      if (down !== hidden) {
        hidden = down;
        gsap.to(bar.current, { yPercent: down ? -110 : 0, duration: 0.7, ease: "power3.out", overwrite: true });
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header ref={bar} className="px-gutter fixed inset-x-0 top-0 z-[60] text-bone mix-blend-difference">
        <div className="grid grid-cols-2 items-center gap-4 py-4 md:grid-cols-12">
          <div data-hd-clip className="overflow-hidden md:col-span-3">
            <TransitionLink
              href="/"
              data-hd-in
              data-cursor-stick
              className="inline-block text-[0.95rem] font-medium tracking-tight"
            >
              <RollText>{`${profile.name}©`}</RollText>
            </TransitionLink>
          </div>

          <div className="hidden overflow-hidden lg:col-span-3 lg:block">
            <p data-hd-in className="mono leading-relaxed text-bone/60">
              Software Engineer
              <br />& Web Developer
            </p>
          </div>

          <div className="hidden overflow-hidden md:col-span-3 md:block">
            <p data-hd-in className="mono leading-relaxed text-bone/60">
              Jakarta, Indonesia
              <br />
              <Clock />
            </p>
          </div>

          <div data-hd-clip className="flex justify-end overflow-hidden md:col-span-6 lg:col-span-3">
            <button
              ref={menuBtn}
              data-hd-in
              data-cursor-stick
              type="button"
              onClick={() => setOpen(true)}
              className="btn-notch"
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              <span>Menu</span>
              <span aria-hidden className="flex flex-col gap-[3px]">
                <span className="block h-px w-3.5 bg-current" />
                <span className="block h-px w-3.5 bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <MenuOverlay open={open} onClose={close} />
    </>
  );
}
