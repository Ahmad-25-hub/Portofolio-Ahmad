"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

const ShaderCanvas = dynamic(() => import("@/components/three/ShaderCanvas"), { ssr: false });

/**
 * Holographic ID card: a live shader backdrop, the cut-out portrait floating
 * on its own depth plane, and a glare that tracks the pointer as the card tilts.
 */
export default function PortraitCard() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 85%", once: true } });
      tl.fromTo(
        card.current,
        { clipPath: "inset(100% 0% 0% 0% round 10px)" },
        { clipPath: "inset(0% 0% 0% 0% round 10px)", duration: 1.6, ease: "expo.inOut" },
      )
        .from("[data-pc-photo]", { yPercent: 18, scale: 1.15, duration: 2, ease: "expo.out" }, 0.4)
        .from("[data-pc-meta]", { yPercent: 110, duration: 1, stagger: 0.06 }, 0.8);
    },
    { scope: root },
  );

  useEffect(() => {
    const el = card.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.8, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.8, ease: "power3" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      rx((0.5 - y) * 14);
      ry((x - 0.5) * 16);
      el.style.setProperty("--gx", `${x * 100}%`);
      el.style.setProperty("--gy", `${y * 100}%`);
      el.style.setProperty("--glare", "1");
    };
    const leave = () => {
      rx(0);
      ry(0);
      el.style.setProperty("--glare", "0");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <figure ref={root} className="relative w-full max-w-[20rem] [perspective:1000px]">
      <div
        ref={card}
        data-cursor="Nice to meet you"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[10px] bg-ink-2 [transform-style:preserve-3d]"
        style={{ "--gx": "50%", "--gy": "30%", "--glare": "0" } as React.CSSProperties}
      >
        <ShaderCanvas colors={["#ff5a1f", "#8f7bff", "#0b0712"]} seed={4.2} className="absolute inset-0" />

        {/* Fine grid + vignette */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(236,232,225,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(236,232,225,.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_100%,rgba(10,10,11,0.85),transparent_60%)]" />

        <div data-pc-photo className="absolute inset-0" style={{ transform: "translateZ(50px)" }}>
          <Image
            src="/images/ahmad.png"
            alt="Portrait of Ahmad"
            width={408}
            height={612}
            sizes="320px"
            className="absolute left-1/2 top-[7%] h-[128%] w-auto max-w-none -translate-x-1/2 drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]"
          />
        </div>

        {/* Glare */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 mix-blend-overlay transition-opacity duration-500"
          style={{
            opacity: "var(--glare)",
            background: "radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.55), transparent 45%)",
          }}
        />

        {/* Card furniture */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4" style={{ transform: "translateZ(70px)" }}>
          <div className="flex justify-between overflow-hidden">
            <span data-pc-meta className="mono block text-bone/80">
              ID — 001
            </span>
            <span data-pc-meta className="mono block text-bone/80">
              JKT / ID
            </span>
          </div>
          <div className="overflow-hidden">
            <span data-pc-meta className="serif block text-[2.6rem] leading-none text-bone">
              Ahmad
            </span>
          </div>
        </div>
      </div>
      <figcaption className="mono mt-3 flex justify-between text-mute">
        <span>Software Engineer</span>
        <span>© 2026</span>
      </figcaption>
    </figure>
  );
}
