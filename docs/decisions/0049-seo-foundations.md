# ADR-0049: Structured data, share images and robots.txt

**Status:** Accepted
**Date:** 2026-10-05 (Portfolio Pass 10)

## Context

Spec S lists the SEO foundations the site must have before the later optimisation phase:

- a head component on every page;
- structured data;
- a sitemap of public pages;
- `robots.txt`;
- share images;
- one canonical host.

Pass 10's acceptance asks for structured data that validates in a schema validator and Lighthouse SEO and accessibility scores of 100 on key pages. Spec S also sets limits:

- no `jobTitle` until Josh holds a role with that title;
- a fixed `knowsAbout` list;
- `VideoObject` only when the upload date is known;
- `alternateName` values that tell Josh apart from John Lennon.

## Decision

**One JSON-LD graph per page,** written by `Seo.astro` from `src/lib/structured-data.ts`. Every function is pure and unit-tested.

- **Every page** has the Person (`@id` `https://joshlennon.com/#person`), built from the profile:
  - `alternateName` and `sameAs` for the profiles that exist;
  - `alumniOf` for finished degrees and `affiliation` for the current one;
  - the headline as `description`;
  - the portrait as `image` once there is one;
  - no `jobTitle`.
- **Other nodes refer to the Person by `@id`** rather than repeating it:
  - the homepage adds a `WebSite`;
  - `/about` adds a `ProfilePage`;
  - work pages add the entry and a `BreadcrumbList`. The entry is a `Thesis` for a dissertation (with the programme and the university), a `ScholarlyArticle` for a paper, and a `CreativeWork` otherwise. Josh is the `author` of sole or led work, a `contributor` to shared work, and neither when the authorship is unknown;
  - log posts add a `BlogPosting` and a `BreadcrumbList`;
  - `/music` adds a `MusicRecording` for each release;
  - YouTube items with the new optional `uploadDate` field add a `VideoObject`.
- `<` is escaped in the serialised graph, so no value can close the script element.

**Validation without an online service.** `src/lib/testing/schema-org.ts` holds the part of the schema.org vocabulary the site uses: each type with the properties schema.org defines for it, its own and inherited. The unit tests and `e2e/seo.spec.ts` check every node on every page in the sitemap against it, along with absolute HTTPS URLs and ISO 8601 dates. A misspelt property, a property on the wrong type or a relative URL fails CI. Google's Rich Results Test and validator.schema.org need a public URL, so they are a post-launch step in `deployment.md`.

**Share images.**

- A work page shares its own cover, or the first page of its document, cut to 1200 by 630 from the top (where a PDF's title is) as a JPEG at build time.
- Every other page shares a default card. `pnpm media:og` renders it in Playwright's Chromium with the site's fonts and palette, using only the name and headline from the profile, and the same script makes the icons (`favicon-32.png`, `favicon.ico`, `apple-touch-icon.png`).
- The images are committed in `public/` because Chromium is not part of the deploy.
- `twitter:card` is `summary_large_image`.

**robots.txt** is an Astro endpoint, so the sitemap line uses `SITE_URL`. It disallows `/admin` and `/api/` (spec S). `/demo` stays crawlable on purpose: a crawler must fetch it to see its `noindex` header, and a disallowed page can still be indexed from links.

**Drafts** are not built in production. In development, a draft work entry or post also carries `noindex`.

## Alternatives considered

- **`schema-dts` or an online validator in CI.** Rejected: `schema-dts` is outside the approved dependencies (spec U.6) and checks types, not the published HTML; an online validator in CI would send every build to a third party and fail when it is down.
- **Generated share images per page (Satori or a canvas library).** Rejected for now: both are new dependencies, and the covers already show the work itself. Spec S allows generated images later.
- **A static `public/robots.txt`.** Rejected: it would hard-code the origin that `SITE_URL` already holds.

## Consequences

- A new content field that should reach search engines needs a line in `structured-data.ts`, and its property in the vocabulary if it is new to the site.
- When the name or headline changes, `pnpm media:og` must be run again. The card reads both from the profile, so it cannot drift silently, but it is not rebuilt automatically.
- The dissertation's share image shows its title page, including the degree it names. That page is already public as the PDF and its cover.
