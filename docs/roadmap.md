# Roadmap

A single-page structural view of project state. Updated on every completed step.

## Phases

| Phase | Status   | Key deliverable                                           |
| ----- | -------- | --------------------------------------------------------- |
| 1     | Complete | Architecture and ADRs 0001–0011                           |
| 2     | Complete | Repo scaffold, plugin skeleton, build pipeline            |
| 3     | Complete | CI, packaging, onboarding (steps 3A–3H)                   |
| 4     | Complete | Wizard engine, end-to-end submission, service abstraction |
| 5     | Complete | Reusable website template (5.0 shell, 5.1 WP routing)     |
| 6     | Future   | Second-client cycle (validates the template)              |

## Step status

| Step | Status   | What                                                 |
| ---- | -------- | ---------------------------------------------------- |
| 4.7  | Complete | Service abstraction layer + decking vertical         |
| 4.8  | Complete | Photo upload pipeline (browser compression + server) |
| 5.0  | Complete | Site shell + 5 reference pages                       |
| 5.1  | Complete | WordPress page mapping + production routing          |

## Deferred (with triggers)

Conscious deferral decisions, including trigger conditions, are maintained in
[`docs/technical-debt.md`](technical-debt.md). The canonical list lives there;
this section only summarises the key items.

| Item                             | Trigger to revisit                        |
| -------------------------------- | ----------------------------------------- |
| Idempotency for submission retry | First observed duplicate Make.com lead    |
| Rate limiting on submit endpoint | >100 submissions/day or observed abuse    |
| Admin replay UI for failed sends | Ops team needs manual retry capability    |
| SSR / static rendering           | SEO or first-load performance requirement |
| h-10 Tailwind utility hygiene    | Visual regression observed                |
| Component testing in jsdom       | Component bug not caught by current tests |
| Multisite WordPress support      | Client requires network activation        |
| Media retention policy           | Privacy concern or storage growth         |

## Out of scope (explicitly not planned)

- CMS / operator content editing (per ADR-0014, target is (b) not (c))
- Multi-tenant / runtime tenant switching (per ADR-0013 amendment)
- Themes registry / per-client theme system (fork-and-customize is the model)
- Internationalization
- Analytics / telemetry infrastructure
- Additional verticals beyond fencing and decking (add via PR per ADR-0013)
