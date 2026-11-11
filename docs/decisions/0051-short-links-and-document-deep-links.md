# ADR-0051: Short links and document deep links

**Status:** Accepted
**Date:** 2026-11-11 (Portfolio Pass 11)

## Context

Josh's CV, printed and as a PDF, gives two addresses on this site: `joshlennon.com/intro-to-deep-learning` and `joshlennon.com/extracting-image-data`. A reader who types or taps one wants the document, not the page around it. Once printed, the paths can never change.

The site is static, and Cloudflare's static assets serve it. Those assets answer a `_redirects` file before serving any file, allow a fragment in the target, and allow up to 2,000 static rules.

## Decision

**One registry, `src/lib/short-links.ts`, and two outputs from it.**

- **The build** (`integrations/short-links.mjs`, in `astro:build:done`) writes `dist/_redirects`: each path as a 301, with and without a trailing slash. It fails if:
  - a target page is not in the build;
  - a target's fragment is not on that page;
  - a short path would shadow a real page or file.
- **`astro dev`** serves the same redirects through Astro's `redirects` option, in development only. In a static build Astro would also write a meta-refresh page at each path, and the edge's 301 should be what answers.
- **Document cards land.** On a work page the cards are `#read`, `#read-2` and so on, in display order, whether the document leads the page or sits under Documents. Loading or navigating to one (`src/scripts/documents.ts`) scrolls to it:
  - From 768 px it opens the reader, as if "Read here" were pressed, with focus on the card's heading rather than inside the PDF.
  - On phones it only scrolls, since Open and Download are right there.
  - It runs after `load`, because the browser's own scroll to the fragment takes focus back to the page.
- **The CV is checked against the site.** `scripts/check-cv.mjs` (in the gates and CI) fails if any `joshlennon.com` link in `/cv.pdf` does not resolve to a page, a file or a short link. It also fails on a phone number, a `tel:` link or a referee, and it never prints what it matched.

The registry holds the CV's two paths, plus `/arbiter` and `/cv` as spares.

## Alternatives considered

- **Pages at the short paths.** Rejected: a 301 tells search engines and readers where the document lives, and a page would be a second URL for it.
- **Redirects in the Worker.** Rejected: static assets answer `_redirects` before the Worker runs, so no code is needed, and the rules are generated from the registry.

## Consequences

- A path in the registry is permanent. Remove one only if nothing printed it.
- Browser tests check each 301 and its exact `Location` against `wrangler dev`, and the landing on desktop and phone.
