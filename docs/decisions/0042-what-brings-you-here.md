# ADR-0042: "What brings you here?": the threshold, and later the wizard

**Status:** Accepted for the threshold (Portfolio Pass 4). The contact wizard and the `content-result` step kind are added to this record in Pass 6.
**Date:** 2026-10-04

## Context

Spec G.0 asks the homepage to put one question first, "What brings you here?", and to route each answer to proof: selected work for people hiring, the research shelf, GrowTrades, music, or the intro for someone just looking. The same question opens the contact wizard (spec I). Three constraints shape how the homepage asks it:

- It is not a gate. Crawlers, screen readers, people without JavaScript, and anyone arriving from a link to a work page must reach content without answering anything.
- A returning visitor must never see it flash before it hides, and nothing may shift (spec P.1: CLS of 0.05 or less).
- The answer stays in the browser (spec G.0, Q.5).

## Decision

**A section, not a modal.** The threshold is the first section of the homepage's HTML: stage, full viewport height, the name as the page's `h1`, one factual sentence, and the question with each answer as a large text row. Every answer is an ordinary link to its section (`#selected-work`, `#research`, `#growtrades`, `#music`, `#intro`), so without JavaScript it is a table of contents.

**The answer is remembered before the first paint.** Choosing stores `{ value, at }` under `localStorage["jl:intent"]`. A short inline script in `<head>` on every page (`BaseLayout.astro`) reads it and sets `html[data-intent]` before the body is parsed; CSS then hides `.first-visit-only` (the threshold) and shows `.returning-only` (the intro's own `h1`, "Choose again", the footer's "Change what brought you here"). The browser test records that the attribute is already set when the parser reaches the threshold, which is what makes "no flash" true rather than likely. Only one `h1` is ever displayed: the threshold's for a first visit, the intro's afterwards.

**Calls to action by CSS alone.** The intro renders all five sets of calls to action (spec G.1) and `[data-cta-for]` rules in `global.css` show the one that matches `html[data-intent]`, with the "just looking" set as the default. Nothing renders on the client, so nothing shifts. Which destinations exist is decided at build time (`src/lib/home.ts`, unit-tested): until `/contact` exists, the conversation action reads "Get in touch" and leads to the email address at the foot of the page; an answer whose primary action has nowhere to go yet (no CV, no GrowTrades section) uses the default set.

**Only answers that lead somewhere.** Sections whose content has not arrived are left out of production builds (spec T.4), and the threshold leaves out any answer whose section is missing. As of Pass 4 that means GrowTrades and music are offered in development only; they appear in production with Passes 7 and 8.

**The transition (spec N.1).** Choosing an answer holds the chosen row while the others fade (150 ms), brings the house lights up (stage to paper, 400 ms, or 250 ms on phones), then finishes inside `document.startViewTransition` where it exists: the threshold hides, the page lands on the section, and focus moves to the section's visible heading (`tabindex="-1"`, marked `data-landing`). With reduced motion it is an instant swap. The script is under 1 kB gzip and uses no library.

**Bringing it back.** "Choose again" in the intro and "Change what brought you here" in the footer are links to `/#threshold` marked `data-choose-again`. A shared script forgets the answer; on the homepage it shows the threshold in place and focuses its question, and on any other page the link goes home, where the head script now finds no answer.

## Alternatives considered

- **A modal or overlay.** Rejected: it blocks content for crawlers and assistive technology and fails spec G.0's "not a hard gate".
- **Rendering the threshold only on the client.** Rejected: first-time visitors would see the intro, then the threshold, which is exactly the shift the spec rules out.
- **A cookie read by the Worker.** Rejected: it would make the homepage dynamic for no gain and would send the answer to the server, which spec G.0 forbids.
- **Hiding the threshold with the `hidden` attribute from script after load.** Rejected: it paints first and then hides, the flash the head script prevents.

## Consequences

- The head script must stay tiny and must be allowed by the Content Security Policy by hash (Pass 9).
- Each pass that adds a homepage section adds its id to the set in `pages/index.astro`, and the threshold offers its answer from then on.
- Work pages join the "never shows on other routes" browser test in Pass 5.
