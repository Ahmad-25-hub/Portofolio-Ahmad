# Portofolio-Ahmad

Personal portfolio for Ahmad, a Software Engineer and Web Developer. Built with Next.js 16, React Three Fiber, custom GLSL shaders, GSAP and Lenis.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Editing content

All text lives in **`src/lib/data.ts`**: profile, stats, projects, capabilities, experience and skills.
Each project's `colors` (primary, secondary, deep) drive its generative WebGL cover.

> Before you publish, replace the LinkedIn and GitHub URLs in `profile.socials`. They are placeholders right now.

## How it fits together

| Feature | Where |
| --- | --- |
| 3D hero (noise-displaced iridescent blob + particles) | `src/components/three/HeroCanvas.tsx` |
| Generative shader covers / hover preview | `src/components/three/ShaderCanvas.tsx` |
| Smooth scrolling (Lenis ↔ GSAP ScrollTrigger) | `src/components/providers/SmoothScroll.tsx` |
| Page transitions (curtain + route listener) | `src/components/providers/TransitionProvider.tsx`, `ui/TransitionLink.tsx` |
| Custom cursor: `data-cursor="Label"` gives a rotating label disc, `data-cursor-stick` makes the cursor wrap and pull the element | `src/components/ui/Cursor.tsx` |
| Portrait (hero WebGL lens + About ID card). To swap it, replace `public/images/ahmad.png` with a transparent PNG | `three/HeroCanvas.tsx`, `ui/PortraitCard.tsx` |
| Preloader, masked text reveals, magnetic button | `src/components/ui/` |
| Sections (Hero, About, Work, Capabilities, Experience, Stack) | `src/components/sections/` |
| Project case-study pages | `src/app/work/[slug]/page.tsx`, `src/components/work/ProjectView.tsx` |

Accessibility and performance:

- The custom cursor only turns on for fine pointers that can hover. On touch devices the cursor is off and the hover preview is replaced by colour swatches.
- `prefers-reduced-motion` turns off smooth wheel scrolling, the grain animation, the marquee drift and CSS transitions.
- WebGL canvases pause when they are off-screen. On mobile the hero uses lower geometry detail and fewer particles. If WebGL fails, the hero shows a CSS fallback instead.
