# Roadmap

The transformation in [`docs/portfolio-spec.md`](portfolio-spec.md) section V is complete: Passes 0 to 10 are merged ([`current-state.md`](current-state.md#passes)). What happens next depends on Josh.

## Before launch (Josh)

Steps 1 to 12 in [`deployment.md`](deployment.md), a screen-reader pass, and the content in spec section W. [`handoff.md`](handoff.md) puts them in order.

## As content arrives

Each of these is code that is already built and waits for content, so it appears without further development:

- **GrowTrades.** The case study, the homepage section and the threshold's website answer.
- **Music.** A music entry brings `/music`, the homepage band and the Music link; footage brings the loop.
- **The first log post.** It brings `/log`, the feed link and the Log link.
- **LinkedIn and Spotify links.** The LinkedIn card, the footer links and the `sameAs` links in structured data.
- **The headshot.** The about page portrait and the `image` in structured data.
- **The CV.** The download on the about page and in the contact wizard's hiring result.

## After launch (candidates, not commitments)

- A reporting endpoint for the Content Security Policy, if an outside script is ever added (ADR-0048).
- Generated share images per work entry, if covers prove a poor fit (spec S).
- A GrowTrades website health check for tradespeople, on a separate GrowTrades site (spec I.1).
- Cloudflare Web Analytics, once `/privacy` says so ([`deployment.md`](deployment.md) step 15).
