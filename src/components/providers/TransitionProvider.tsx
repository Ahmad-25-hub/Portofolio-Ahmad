"use client";

import {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis, setPageReady } from "@/lib/store";
import { getProject } from "@/lib/data";

type Ctx = { navigate: (href: string, label?: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

const PANELS = 5;

function labelFor(pathname: string) {
  if (pathname === "/") return "Home";
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  return getProject(slug)?.title ?? "Loading";
}

function scrollToTarget(hash: string | null, immediate: boolean) {
  const lenis = getLenis();
  const target = hash ? document.querySelector<HTMLElement>(hash) : null;
  if (lenis) {
    lenis.scrollTo(target ?? 0, immediate ? { immediate: true, force: true } : { duration: 1.6, force: true });
  } else {
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }
}

/** Isolated so `usePathname` sits behind its own Suspense boundary. */
function RouteListener({ onChange }: { onChange: (path: string) => void }) {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange(pathname);
  }, [pathname, onChange]);
  return null;
}

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const curtain = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const pendingHash = useRef<string | null>(null);
  const fallback = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [label, setLabel] = useState("");

  const reveal = useCallback(() => {
    if (fallback.current) clearTimeout(fallback.current);
    const el = curtain.current;
    if (!el) return;
    const panels = el.querySelectorAll(".curtain-panel");

    // Two frames: let the new route paint before measuring/scrolling.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        scrollToTarget(pendingHash.current, true);
        pendingHash.current = null;
        ScrollTrigger.refresh();
        getLenis()?.start();

        gsap
          .timeline({
            onComplete: () => {
              busy.current = false;
              gsap.set(el, { visibility: "hidden" });
            },
          })
          .to(labelRef.current, { yPercent: -120, duration: 0.5, ease: "power3.in" })
          .add(() => setPageReady(true), "-=0.15")
          .to(
            panels,
            {
              scaleY: 0,
              transformOrigin: "50% 0%",
              duration: 0.9,
              ease: "power4.inOut",
              stagger: { each: 0.05, from: "end" },
            },
            "<",
          );
      }),
    );
  }, []);

  const navigate = useCallback(
    (href: string, customLabel?: string) => {
      const url = new URL(href, window.location.href);

      // Same page: just glide to the anchor (or top).
      if (url.pathname === window.location.pathname) {
        scrollToTarget(url.hash || null, false);
        return;
      }
      if (busy.current) return;
      busy.current = true;
      pendingHash.current = url.hash || null;
      setLabel(customLabel ?? labelFor(url.pathname));
      getLenis()?.stop();

      const el = curtain.current!;
      const panels = el.querySelectorAll(".curtain-panel");
      router.prefetch(url.pathname);

      gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .fromTo(
          panels,
          { scaleY: 0, transformOrigin: "50% 100%" },
          { scaleY: 1, duration: 0.8, ease: "power4.inOut", stagger: 0.05 },
        )
        .fromTo(
          labelRef.current,
          { yPercent: 120 },
          { yPercent: 0, duration: 0.7, ease: "expo.out" },
          "-=0.35",
        )
        .add(() => {
          setPageReady(false);
          router.push(url.pathname + url.search, { scroll: false });
          // Safety net: never leave the curtain down.
          fallback.current = setTimeout(reveal, 4000);
        });
    },
    [router, reveal],
  );

  const onRouteChange = useCallback(() => {
    if (busy.current) {
      reveal();
    } else {
      // Browser back/forward: no curtain, just make sure the page is live.
      ScrollTrigger.refresh();
      setPageReady(true);
    }
  }, [reveal]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <Suspense fallback={null}>
        <RouteListener onChange={onRouteChange} />
      </Suspense>
      <div ref={curtain} className="curtain" aria-hidden>
        {Array.from({ length: PANELS }).map((_, i) => (
          <div key={i} className="curtain-panel" />
        ))}
        <div className="curtain-label">
          <span ref={labelRef} className="block text-center">
            <span className="mono block opacity-60">Next —</span>
            <span className="serif block text-[clamp(3rem,9vw,9rem)] leading-none">{label}</span>
          </span>
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
