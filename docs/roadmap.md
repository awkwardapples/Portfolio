# Roadmap

A single-page, structural view of project state. Update on every completed step.

## Phases

| Phase | Status      | Key deliverable                                           |
| ----- | ----------- | --------------------------------------------------------- |
| 1     | Complete    | Architecture and ADRs 0001–0011                           |
| 2     | Complete    | Repo scaffold, plugin skeleton, build pipeline            |
| 3     | Complete    | CI, packaging, onboarding (steps 3A–3H)                   |
| 4     | Complete    | Wizard engine, end-to-end submission, service abstraction |
| 5     | In progress | Reusable website template + WP deployment verified        |
| 6     | Future      | Second-client deployment (validates the template)         |

## Step status

| Step | Status   | What                                                    |
| ---- | -------- | ------------------------------------------------------- |
| 4.7  | Complete | Service abstraction + decking vertical                  |
| 4.8  | Complete | Photo upload capability + tests                         |
| 5.0  | Complete | Site shell + 5 reference pages                          |
| 5.1  | Complete | WordPress page mapping + production routing             |
| 5.2  | Complete | OV-001 remediation (F5+F6 fixes, F1+F3 documented)      |
| 5.3  | Gated    | Adaptation runbook (gated on 5.2 + OV-001 criterion 21) |

## Gating

Step 5.3 and beyond are gated on:

1. Step 5.2 completion (all 5.2 acceptance criteria green).
2. A fresh OV-001-style verification against the 5.2 deployed artifact
   confirming the submission flow now succeeds end-to-end in WordPress.

This gating reflects the OV-001 lesson: green gates do not equal "works in
WordPress." A real deploy-and-exercise cycle is required before declaring any
step that affects the deployed system actually complete.

## Deferred

See `docs/technical-debt.md` for the full catalog of deferred work with trigger
conditions.

| Item                             | Trigger to revisit                         |
| -------------------------------- | ------------------------------------------ |
| FrontPagePolicy heuristic (F2)   | First client with custom front page config |
| Idempotency for submission retry | First observed duplicate Make.com lead     |
| Rate limiting on submit endpoint | >100 submissions/day or observed abuse     |
| Admin replay UI for failed sends | Ops team needs manual retry capability     |
| SSR / static rendering           | SEO or first-load performance requirement  |
| h-10 Tailwind utility hygiene    | Visual regression observed                 |
| Component testing in jsdom       | Component bug not caught by current tests  |
| Multisite WordPress support      | Client requires network activation         |
| Media retention policy           | Privacy concern or storage growth          |

## Out of scope (explicitly not planned)

- CMS / operator content editing (per ADR-0014, target is (b) not (c))
- Multi-tenant / runtime tenant switching (per ADR-0013 amendment)
- Themes registry / per-client theme system (fork-and-customize is the model)
- Internationalization
- Analytics / telemetry infrastructure
- Additional verticals beyond fencing and decking (add via PR per ADR-0013)
