# ADR-0046: Media pipeline, third-party facades and build-time data

**Status:** Accepted
**Date:** 2026-10-05 (Portfolio Pass 8)

## Context

The portfolio shows Josh's videos, music, footage and GitHub activity (spec K, M). Each normally pulls in a third party on page load: YouTube and Spotify embeds set cookies and load hundreds of kilobytes, GitHub widgets call its API from the browser, and background video costs data whether or not anyone watches. Spec P.2 allows nothing from another origin on first view, and spec Q.5 promises no cookies.

## Decision

**Facades for YouTube and Spotify** (`components/media/YouTube.astro`, `Spotify.astro`, `scripts/embeds.ts`). At build time the site asks oEmbed for the real title and thumbnail (`lib/oembed.ts`); for YouTube it prefers the 1280 px still, then 640 px, then oEmbed's 480 px. Each remote image is checked with a HEAD request first (`firstAvailable`), because Astro fetches remote images late in the build and a missing one would fail it; then Astro downloads and optimises it to AVIF, and it is served from this site (`image.domains` in `astro.config.mjs`). The facade is a link to the video or track on the provider's site ("Play video", "Play on Spotify"), so it works without JavaScript; with JavaScript a click creates the player (`youtube-nocookie.com` for YouTube) and moves focus into it. A note under each says where it plays from. If oEmbed or the image cannot be reached, the content's own title and a plain stage panel stand in, and the build carries on.

Spec K.2 asks for a `<button>`; a link that the script takes over does the same with JavaScript and still works without it, so the link is used.

**The footage loop** (`islands/FootageLoop.tsx`, `lib/footage.ts`). The loop sets come from `pnpm media:video` (AV1 and H.264 at 1080p and 720p, an optional portrait crop, a poster). The island shows the poster at once at a fixed 16:9, attaches the files only within a screen of view, chooses them for the screen (AV1 first), plays while at least half visible and pauses otherwise, and always offers a pause and play button with a tooltip. It never starts by itself with reduced motion, Save-Data, or a 2G or 3G connection. The decisions are pure functions with unit tests. A music entry's `media` item of type `video` with `loop: true` becomes the loop on `/music` and the homepage's music band.

**Music appears with music.** `lib/music.ts` gathers releases (Spotify), videos (YouTube) and the first loop from entries with `kind: music`. `/music` is a rest route that is built only when there is something to show, the navigation links it only then, and the homepage band and the threshold's music answer follow the same rule. Until Josh adds music, none of it exists in production.

**GitHub at build time** (`lib/github.ts`). With `GH_PROFILE_TOKEN` set (the deploy workflow, a fine-grained read-only token), the build asks the GraphQL API for the profile, pinned repositories and the contribution calendar, and writes `src/data/github.snapshot.json`. Without the token, or if GitHub fails, the committed snapshot is used with a warning; the build never fails for GitHub, and the browser never calls it. The calendar is drawn as squares in five palette steps from `paper-sunken` to `ink`, with a sentence giving the total and a visually hidden table of monthly totals; on narrow screens it scrolls inside its own box, opening on the most recent weeks. The avatar is downloaded and optimised at build time.

**Only pinned repositories are listed.** Josh chooses what to feature by pinning it on GitHub. With nothing pinned, the section shows the calendar and the profile link only. Listing recent repositories instead was rejected: two of the public ones still hold SCB agency documents (see `current-state.md`), and the portfolio must not point at them.

**LinkedIn** is a plain card from `profile.yaml` (name, headline, current published roles, "View profile on LinkedIn"), shown once the profile URL is there. It does not imitate LinkedIn's interface. The Aceternity link previews are skipped until Josh supplies screenshots of his own profiles (spec M.2).

## Alternatives considered

- **Third-party embed libraries (lite-youtube-embed and similar).** Rejected: an extra dependency for twenty lines of script, and they still load thumbnails from Google.
- **Fetching GitHub in the browser.** Rejected for privacy, rate limits and layout shift.
- **A `<video autoplay>` tag with `poster`.** Rejected: it downloads the video on every visit and ignores Save-Data.

## Consequences

- The production build needs network access for fresh titles and thumbnails; offline builds still succeed with fallbacks.
- `src/data/github.snapshot.json` changes when the deploy refreshes it. The committed copy is the last one fetched on a developer's machine; the deploy builds use the live data.
- Browser tests record every request on every route and fail on any to another origin before interaction.
