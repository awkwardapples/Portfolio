# ADR-0042: "What brings you here?": the threshold, the contact wizard and the content-result step

**Status:** Accepted (the threshold in Portfolio Pass 4; the contact wizard and the engine changes in Pass 6)
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

## Decision, part two: the contact wizard (Pass 6)

**One question, asked once.** `/contact` opens on the intent: from `?intent=` (the homepage's calls to action), else from the answer the threshold stored, else a selector with the threshold's wording. Choosing there stores the answer too. "Just looking" maps to the wizard's `other` intent.

**Five configurations, one registry.** `apps/site/src/wizard/intents.ts` holds a manual-mode `WizardConfig` per intent (spec I.3), with the contact field ids the Worker's checks rely on (`contact_name`, `contact_email`, `organisation`, `message`, `data_processing_consent`). Every journey is: two or three questions, the result, your details, optional details with "Skip and send", sent. Every free-text field has a `maxLength`. The file imports only engine types, so the Worker imports the same objects and validates answers with the same code as the browser (ADR-0043).

**The content-result step.** A new step kind in the engine, added the way ADR-0024 adds step kinds: no fields, always valid, Next continues, the exit button calls a host handler. The engine stays content-agnostic: the step names a `selection` (featured, research, venture, music) and the host provides the items through `ContentResultsContext`. The portfolio computes them at build time from the collections (`src/wizard/content-index.ts`, unit-tested; "featured" follows the homepage's selected-work rule) and passes them as island props. A result step with nothing to show is dropped for that visit; the hiring result opens with the availability sentence and ends with the CV download once the CV exists (spec Y.5).

**Additive engine changes (spec I.6), each defaulting to the SCB behaviour:**

- `WizardEnvironmentContext`: the Turnstile site key and action. The SCB quote page now provides its key from `window.GOQW_CONFIG`; components no longer import `config-loader`, which would pull all twelve SCB trade configurations into any host's bundle (`/contact` ships 77.5 kB of JavaScript gzipped against a 120 kB budget).
- `WizardCopyContext`: every string on the success, failure and submitting screens, the navigation buttons and the selector, plus the screens' heading level; the defaults are the SCB strings, checked by a test.
- `httpSubmissionPort` takes an `endpointUrl`, and sends no nonce header without a nonce.
- `WizardShell` takes `landmark` (the portfolio's page already has the `<main>` and the skip link) and `className`.
- Fields take an optional `maxLength`, and checkbox fields an optional `helpLink` (the consent checkbox links to `/privacy`); `role_link` gets a URL format check.
- Inputs, selects and standard buttons are 44 px tall (spec O), up from 40: a visible change to the SCB build too, and an accessibility improvement there as well.

**The island.** `apps/site/src/islands/ContactWizard.tsx` is adapted from the SCB `QuotePage`: the same store, session-storage persistence per intent, bot-protection enrichment and HTTP port, configured by props, mounted `client:only` with a skeleton in the shape of the selector. Without JavaScript the page shows the email address instead (`.no-js-only`, set from `html.js` in the head script, because Chromium does not render `<noscript>` when scripting is turned off for tests).

## Alternatives considered

- **A modal or overlay.** Rejected: it blocks content for crawlers and assistive technology and fails spec G.0's "not a hard gate".
- **Rendering the threshold only on the client.** Rejected: first-time visitors would see the intro, then the threshold, which is exactly the shift the spec rules out.
- **A cookie read by the Worker.** Rejected: it would make the homepage dynamic for no gain and would send the answer to the server, which spec G.0 forbids.
- **Hiding the threshold with the `hidden` attribute from script after load.** Rejected: it paints first and then hides, the flash the head script prevents.

- **Rendering the result step's items inside the engine from a content API.** Rejected: the engine would learn about the portfolio's collections; the context keeps it reusable.
- **Separate server-side copies of the validation rules.** Rejected: two definitions of a valid answer drift; sharing the configs and `validateStep` cannot.

## Consequences

- The head script must stay tiny and must be allowed by the Content Security Policy by hash (Pass 9).
- Each pass that adds a homepage section adds its id to the set in `pages/index.astro`, and the threshold offers its answer from then on.
- Work pages joined the "never shows on other routes" browser test in Pass 5.
- A new intent is a new entry in `intents.ts` and a label in `lib/intents.ts`; the Worker accepts it with no change.
- Labels and copy can change freely; ids and option values are contracts (stored rows, the webhook payload, the Sheet's columns).

## Addendum (7 October 2026): four answers

Josh took "Music" out of the threshold: music is a hobby, and its homepage section is there for everyone who scrolls. The answers are "I'm hiring", "Research", "What experience do you have?" (the former website answer, renamed the same day) and "Just looking around". Music stays an option in the contact form ("Contact my management"). Choosing it there now stores "just looking" for the homepage, which no longer has a music set of calls to action. The CSS that shows each answer's calls to action had kept the old `website` id, so returning visitors who chose "What experience do you have?" saw none; it now uses `experience`, and a browser test checks every answer the threshold offers.
