# Roadmap

The work follows the passes in [`docs/portfolio-spec.md`](portfolio-spec.md), section V. Each pass ends with every gate green, `docs/current-state.md` updated, and a merge to `main`. Status per pass is in [`current-state.md`](current-state.md#passes).

| Pass | Objective                                                            | Waits on Josh for                                  |
| ---- | -------------------------------------------------------------------- | -------------------------------------------------- |
| 0    | Remove sensitive material and clutter; scrub history                 | Done                                               |
| 1    | The monorepo builds and deploys an empty but real site               | Cloudflare secrets, for the first real deploy      |
| 2    | Content model, legacy entries, media and PDF tooling, the TODO guard | PDFs for the research and software entries         |
| 3    | Visual identity as tokens, fonts, navigation, footer, style guide    | Footage stills to check the accent against         |
| 4    | Homepage with the "What brings you here?" threshold                  | Portrait is supplied; bio and photos fill in later |
| 5    | Work, research, log and about pages, documents and citations         | Content and PDFs                                   |
| 6    | Contact wizard and the Worker submission pipeline                    | Turnstile keys, Worker secrets, Make.com changes   |
| 7    | GrowTrades case study with the live SCB demo                         | Case-study narrative and test-data screenshots     |
| 8    | Music, footage loop, video and Spotify facades, GitHub and LinkedIn  | Footage, music links, `GH_PROFILE_TOKEN`           |
| 9    | Responsive, performance and accessibility hardening, CSP enforced    | Nothing                                            |
| 10   | SEO foundations, final documentation, custom domain and launch       | Domain on Cloudflare, Email Routing                |

Content still needed from Josh is listed in spec section W.

After launch, candidates (not committed): a GrowTrades website health check for tradespeople on a separate GrowTrades site (spec I.1), generated Open Graph images (spec S).
