"use client";

import { useRef } from "react";
import Reveal from "@/components/ui/Reveal";
import RollText from "@/components/ui/RollText";
import Clock from "@/components/ui/Clock";
import PixelBand from "@/components/ui/PixelBand";
import GlyphName from "@/components/ui/GlyphName";
import { gsap, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/store";
import { profile } from "@/lib/data";

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from("[data-ft-fade]", {
        y: 30,
        opacity: 0,
        duration: 1.2,
        stagger: 0.07,
        scrollTrigger: { trigger: "[data-ft-main]", start: "top 75%", once: true },
      });
      gsap.from("[data-ft-line]", {
        scaleX: 0,
        transformOrigin: "0% 50%",
        duration: 1.6,
        ease: "expo.inOut",
        scrollTrigger: { trigger: "[data-ft-line]", start: "top 95%", once: true },
      });
    },
    { scope: root },
  );

  return (
    <footer
      id="contact"
      ref={root}
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(90% 60% at 85% 105%, rgba(255,90,31,0.55), rgba(255,90,31,0.12) 45%, transparent 70%), linear-gradient(180deg, #0a0a0b 0%, #0f0a09 35%, #1f0c06 75%, #3a1305 100%)",
      }}
    >
      <PixelBand variant="diamond" />

      {/* Call to action */}
      <div data-ft-main className="px-gutter grid gap-12 pt-[clamp(5rem,11vw,10rem)] md:grid-cols-12">
        <div className="md:col-span-8">
          <p data-ft-fade className="mono mb-8 text-mute">
            (06) — Contact
          </p>
          <Reveal as="h2" className="font-medium leading-[0.9] tracking-[-0.055em]">
            <span className="block text-[clamp(3rem,8.2vw,9.5rem)]">
              Have something
              <br />
              <span className="serif text-accent">worth</span> building?
            </span>
          </Reveal>
          <p data-ft-fade className="mono mt-8 text-mute">
            Based in Jakarta, ID · UTC+7 · <Clock />
          </p>
          <div data-ft-fade className="mt-10 flex flex-wrap gap-3">
            <a
              href={`mailto:${profile.email}`}
              data-cursor-stick
              className="btn-notch h-12! px-5! text-bone"
              style={{ "--btn-bg": "var(--ink)" } as React.CSSProperties}
            >
              <span>Send an email</span>
              <span aria-hidden>↗</span>
            </a>
            <a
              href={profile.socials[0]?.href}
              target="_blank"
              rel="noreferrer"
              data-cursor-stick
              className="btn-notch h-12! px-5! text-accent"
              style={{ "--btn-bg": "var(--ink)" } as React.CSSProperties}
            >
              <span>LinkedIn</span>
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>

        <div className="grid gap-8 self-end sm:grid-cols-2 md:col-span-4 md:grid-cols-1">
          <div data-ft-fade>
            <p className="mono mb-3 text-mute">Direct</p>
            <a href={`mailto:${profile.email}`} className="text-[0.95rem] tracking-tight [overflow-wrap:anywhere]">
              <span className="u-line">{profile.email}</span>
            </a>
          </div>
          <div data-ft-fade>
            <p className="mono mb-3 text-mute">Elsewhere</p>
            <ul className="space-y-1.5">
              {profile.socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    data-cursor-stick
                    className="text-[0.95rem] tracking-tight"
                  >
                    <RollText>{`${s.label} ↗`}</RollText>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Interactive code-glyph wordmark */}
      <div className="px-gutter mt-[clamp(4rem,8vw,7rem)]">
        <GlyphName text="AHMAD" className="h-[19vw] min-h-24" />
      </div>

      {/* Bottom bar */}
      <div className="px-gutter mt-6">
        <div data-ft-line className="hairline" />
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="mono text-mute">© 2026 {profile.name}</p>
          <p className="mono hidden text-mute sm:block">Built with Next.js, Three.js &amp; GSAP</p>
          <button
            type="button"
            onClick={() => getLenis()?.scrollTo(0, { duration: 2.2 })}
            data-cursor-stick
            className="mono group flex items-center gap-2.5 text-bone"
          >
            <RollText>Back to top</RollText>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="size-4 transition-transform duration-500 group-hover:-translate-y-1"
            >
              <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Signal band + sign-off */}
      <div className="pb-6">
        <PixelBand variant="signal" />
        <div className="px-gutter mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="mono text-mute">
            Compiled in <span className="text-bone">“Jakarta, ID · 06°10′S 106°49′E”</span> — one commit at a time.
          </p>
          <p className="serif text-[1.05rem] text-bone/80">Terima kasih sudah mampir.</p>
        </div>
      </div>
    </footer>
  );
}
