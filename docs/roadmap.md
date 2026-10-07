# Roadmap

The transformation in [`docs/portfolio-spec.md`](portfolio-spec.md) section V is complete: Passes 0 to 10 are merged ([`current-state.md`](current-state.md#passes)). What happens next depends on Josh.

## Before launch (Josh)

Steps 1 to 11 in [`deployment.md`](deployment.md) and a screen-reader pass. The content in spec section W is in, apart from what is listed below. [`handoff.md`](handoff.md) puts them in order.

## As content arrives

Most of these are already built and appear with the content:

- **More log posts.** The first (7 October 2026) brought `/log`, the feed and the Log link; "Lately" shows the three newest.
- **A Spotify release.** A `type: spotify` item in a music entry adds the release to `/music` (today there are the artist link and Josh's screenshot of the profile).
- **Photos.** The outside-work section (spec G.6) was taken off the homepage until there are photos. The profile already holds them (`photos:`); the section itself needs building when they arrive.
- **More work.** The news classifier and the London Heathrow programme were left out because their dates and details were not given; `pnpm new work` brings them back when they are.

## After launch (candidates, not commitments)

- A reporting endpoint for the Content Security Policy, if an outside script is ever added (ADR-0048).
- Generated share images per work entry, if covers prove a poor fit (spec S).
- A GrowTrades website health check for tradespeople, on a separate GrowTrades site (spec I.1).
- Cloudflare Web Analytics, once `/privacy` says so ([`deployment.md`](deployment.md) step 14).
