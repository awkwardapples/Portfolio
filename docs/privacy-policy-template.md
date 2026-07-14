# Privacy Policy Template

**Step 5.14.** This document explains where the template's privacy policy content
lives and how to customize it for a new client — it is not a copy of the legal text
itself, to avoid two versions of the policy drifting out of sync.

## Where the real content lives

`apps/wizard/src/site/content/privacy-content.ts` — the same "edit this file to adapt
the template for a new client" convention as `site-content.ts` and `footer-content.ts`
(see `AUDIT-5.14-business-metadata.md` for why this is a plain content file rather than
a WordPress page or a `{{PLACEHOLDER}}` template resolved server-side).

It exports `privacyContent`, an array of sections (`{ id, heading, body }`), rendered
by `apps/wizard/src/site/pages/PrivacyPolicyPage.tsx` at the `/privacy` route (linked
from the site footer on every page).

## The 10 sections (UK GDPR minimum disclosures)

| Section id               | Covers                                         |
| ------------------------ | ---------------------------------------------- |
| `who-we-are`             | Business name and what this policy covers      |
| `what-we-collect`        | Name, contact details, project details, photos |
| `why-we-collect-it`      | Lawful basis — consent (ADR-0029)              |
| `how-we-use-it`          | Providing a quote, following up                |
| `who-we-share-it-with`   | Cloudflare, Make.com, WhatsApp/Meta            |
| `how-long-we-keep-it`    | Retention periods (submissions, photos)        |
| `your-rights`            | Access, rectification, erasure, ICO complaint  |
| `exercising-your-rights` | How to contact the business about their data   |
| `contact-us`             | Business name, address, email, phone           |
| `policy-changes`         | Where the "last updated" date is shown         |

## Customizing for a new client

1. Business identity (name, email, address, phone) is **not** duplicated in this file
   — it's pulled directly from `site-content.ts`'s `siteContent` object, so updating
   that file (already required for general site customization) keeps the policy in
   sync automatically.
2. Update `retention_days` prose in `how-long-we-keep-it` only if the client's
   `goqw_retention_days` WordPress option differs from the 90-day default — the policy
   text is static and does not read the live option value.
3. Update `who-we-share-it-with` if the client's deployment adds or removes a
   third-party processor (e.g. a different automation tool instead of Make.com).
4. Update the `lastUpdated` constant whenever any section's substance changes.
5. Have a UK solicitor review the policy before production use for any client handling
   meaningful data volume — this template is a reasonable starting point, not legal
   advice.

See `docs/llm-customization-handoff.md` (Task 10) for the step-by-step customization
checklist, and `docs/business-owner-data-handling-guide.md` for what the business owner
themselves needs to know.
