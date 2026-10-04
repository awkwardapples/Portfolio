# ADR-0044: The SCB demo build and same-origin framing

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 7)

## Context

GrowTrades is best shown by letting a visitor use the client site, SCB Handyman, inside the case study (spec J). The site is the wizard app in `apps/wizard`, built for a WordPress host: it reads `window.GOQW_CONFIG`, routes with `history.pushState`, and submits to the plugin's REST endpoint. Inside the portfolio it must run with no server, submit nothing, sit in a frame without its URL changing, tell the frame where it is, and load nothing until the visitor asks. Josh has permission to use SCB's name, branding and images.

## Decision

**A demo build of the real site.** `pnpm --filter @growth-ops/wizard build:demo` runs `vite build --mode demo`: a separate Vite configuration with `demo/index.html` as the page, base `/demo/scb-handyman/`, output in `apps/site/public/demo/scb-handyman/` (gitignored, rebuilt by the root `pnpm build` before the site), and no source maps. The production build for WordPress is unchanged. The demo page sets `window.GOQW_CONFIG` with an empty `restUrl`, so `QuotePage` uses its existing development port and no request leaves the browser; `<meta name="robots" content="noindex">` and the header `X-Robots-Tag: noindex` keep it out of search.

**A memory router.** `VITE_ROUTER_MODE=memory` (`.env.demo`) switches the site's navigation (`site/routing/navigation.ts`, unit-tested) to keep the route in memory: `Link` and `SiteApp` read and change it there, the iframe's own URL never changes, and each navigation posts `{ type: 'scb-demo:navigate', path }` to the parent, addressed to this origin only. A link opened in a new tab opens the demo on that page through `?path=`. Only `QuotePage`'s `?service=` read had to move to the same module.

**Saying so.** A slim banner stays at the bottom of every demo page: "Demo of the SCB Handyman site. Nothing you enter is sent anywhere." The success screen says the same, through `WizardCopyContext` (ADR-0042).

**Images.** Every SCB image stays. The sources in `apps/wizard/src/assets/images/` are not touched; `scripts/media/demo-images.mjs` re-encodes only the oversized copies in the demo build, at the same dimensions and format, keeping a file only when it is smaller (the plumbing photograph goes from 1.3 MB to 74 kB). The demo is 1.3 MB in all.

**The frame** (`apps/site/src/islands/SiteFrame.tsx`, hydrated when visible):

- facade first: a still of the SCB homepage (captured by `pnpm media:screens` with Playwright, served as AVIF) and "Try the live site", a link to the demo that the island takes over, so it also works without JavaScript;
- on wider screens the demo runs at a true 1280 px viewport scaled to the frame, with a Desktop and Mobile (390 px) toggle, a skeleton of the SCB homepage until the iframe loads, and an address bar showing `scbhandyman.co.uk` and the path the demo reports; messages are accepted only from this origin and from the demo's own frame (`lib/site-frame.ts`, unit-tested);
- on phones the frame is a phone outline with a still, and the demo opens full screen in a native dialog, so it scrolls natively; Escape and the close button return focus to the trigger;
- "Open in a new tab" is always there.

**Framing.** `/demo/*` drops `X-Frame-Options` and sends `Content-Security-Policy: frame-ancestors 'self'`: this site can frame it, no other can. Everything else keeps `X-Frame-Options: DENY`.

**The case study** uses the work page's `case-study` template: a wide body for Fig. 1 (the live site), "Under the hood" (each pipeline step beside the code that runs it, cut from this repository at build time and failing the build if the code moves, spec N.5), and figures that are recorded or computed ("Engineering"). The frame tilts flat as it scrolls into view (N.4) with a CSS scroll-driven animation rather than the `motion` library, so the page ships no animation JavaScript.

## Alternatives considered

- **Hash routing in the demo.** Rejected: the SCB site already uses `#` for in-page sections, and the address in the iframe would still change.
- **Re-encoding the source images in place**, as spec J.3 suggests. Rejected in favour of re-encoding the build's copies: the originals stay byte for byte as Josh supplied them, and the demo is just as light.
- **Aceternity's Container Scroll and Sticky Scroll components.** Their ideas are used; the code is not: both would bring `motion` into the case study for effects CSS and a dozen lines of script can do.
- **Loading the iframe straight away.** Rejected: the demo is 100 kB of JavaScript and 1.2 MB of images that most visitors to the page never use.

## Consequences

- The demo is rebuilt on every `pnpm build`; CI builds it before the site, and the Playwright tests run a whole quote request through it and check that nothing is sent, that it reports its pages to a framing page, and that another origin cannot frame it.
- The SCB site's own gaps show in the demo as they are: three project images it has always referenced at `/images/placeholder-*.jpg` do not exist, and the quote page's heading is dark on a dark background. Fixing them is SCB site work.
- The case study needs Josh's dates, authorship and two paragraphs before it is published; its browser tests skip themselves until then.
