# ADR-0029: Data Protection & UK GDPR Compliance

**Status:** Accepted (Step 5.14, 2026-07-14)

## Context

The template processes personal data of website visitors submitting quote requests
(name, contact details, address, project details, and optionally photos). UK GDPR and
the Data Protection Act 2018 require a lawful basis for that processing, a privacy
notice, evidence of consent (or another lawful basis), a bounded retention period, and
a documented way for the business owner to honour data subject requests. Before this
step none of these existed: there was no privacy policy page, no consent capture, and
submission retention was an unimplemented stub (`Cron\PruneSubmissions`) scheduled but
never wired to a callback.

## Decision

**Lawful basis: consent**, captured explicitly, not legitimate interest. The spec's own
draft ADR content proposed legitimate interest; this step implements consent instead
because the wizard already has a natural, non-skippable point to capture it (a
required field on the last mandatory step) and an explicit, timestamped consent record
is stronger evidence than an inferred legitimate-interest justification, at no extra
engineering cost.

- **Consent capture:** a required `checkbox` field (`data_processing_consent`, key
  matches everywhere) on the last mandatory step of every one of the 11 wizard
  configs — `contact-and-address` for the 7 instant-quote services, `address` for the
  4 manual-quote services. Not on `optional-details`, which is deliberately skippable.
- **Consent enforcement:** client-side `required: true` is UX only.
  `ConsentValidator` is the real trust boundary — `SubmissionController` rejects any
  submission lacking a valid consent answer with `400 { errorCode: 'consent_required' }`
  before anything is persisted.
- **Consent storage:** `consent_given` (bool) and `consent_timestamp` (UTC datetime)
  columns on `wp_goqw_submissions`, written on every successful insert.
- **Privacy notice:** a new `/privacy` route on the marketing site, with real UK
  GDPR-required disclosure content (10 sections: who we are, what we collect, why,
  how we use it, who we share it with, retention, rights, how to exercise them,
  contact, changes to this policy).
- **Data retention:** submissions are deleted after `Settings::retention_days()`
  (default 90 days, already implemented and configurable) via a real implementation of
  the previously-stub `Cron\PruneSubmissions`, now hooked in `Plugin::boot()`. Photos
  are deleted independently by the existing `PhotoRetention` job on its own 6-month
  cadence (Step 5.13e) — unchanged.
- **Right to erasure:** manual, via the business owner guide. No automated
  self-service endpoint in this step.

## Implementation

Schema addition (via the existing `dbDelta` mechanism, matching `is_duplicate`/
`duplicate_of` from Step 5.13g):

- `consent_given` TINYINT(1) NOT NULL DEFAULT 0
- `consent_timestamp` DATETIME NULL

`ConsentValidator::is_given()` checks `answers['data_processing_consent']` for the
checkbox field's checked-array shape (`['agreed']`), matching how every other checkbox
field in the wizard engine stores its answer. `SubmissionController` runs this check
immediately after shape validation and before duplicate detection; a valid submission
gets `consent_given = true` and `consent_timestamp = current_time('mysql', true)`
written alongside `is_duplicate`/`duplicate_of` before insert.

`/privacy` is registered the same way every other marketing route is: an entry in
`SiteRoutes::PATHS` (PHP) and `routes.ts` (TypeScript), kept in sync by the existing
`CrossLanguageRoutesTest`, plus matching `SEORouteContent`/`SitemapGenerator` entries.
`PrivacyPolicyPage.tsx` renders content from a new `privacy-content.ts` file that
imports business identity (name, email, address) directly from the existing
`site-content.ts` — the established per-client customization file for the marketing
site.

`Cron\PruneSubmissions::run()` now calls a new
`SubmissionRepository::delete_older_than( $cutoff )`, with `$cutoff` computed from
`Settings::retention_days()`. `Plugin::boot()` hooks `goqw_prune_submissions` to it —
the event has been scheduled in `Activator` since Step 3D but never had a callback.

## Deviations from the spec

Recorded here because they reflect real architectural constraints discovered during
Phase 0 audits, not arbitrary preference:

- **No `PrivacyPolicyPage.php` / `wp_insert_post()` page creation.** The spec assumed
  privacy policy creation follows the same pattern as `SiteRootPage` — it does not.
  `SiteRootPage` creates exactly one content-less mount point for the entire React
  app; the site's actual multi-page marketing content (Home, Services, Contact, etc.)
  is a static client-side route table backed by plain content files, never a
  per-content-page WP post. `footer-content.ts` already linked to `/privacy`
  (dangling — no matching route existed, silently falling back to Home per ADR-0016)
  — this step fills in that gap with a sixth route, not a new WordPress entity
  (`AUDIT-5.14-page-creation.md`).
- **No `{{BUSINESS_NAME}}`/`{{BUSINESS_EMAIL}}`/`{{BUSINESS_ADDRESS}}` placeholder
  template.** The privacy policy is a plain React component that imports
  `siteContent` directly, the same way `ContactPage.tsx` already does. Per-client
  customization of the privacy policy's business identity is already covered by the
  existing instruction to edit `site-content.ts` (`AUDIT-5.14-business-metadata.md`).
  Only `lastUpdated` has no existing equivalent and is a plain hand-edited string.
- **No new `SubmissionRetention` class or `goqw_submission_retention_cleanup` cron
  event.** `Cron\PruneSubmissions` already exists for exactly this purpose — scheduled
  in `Activator` since Step 3D, explicitly documented as a stub awaiting real logic
  (`AUDIT-5.13e-cron-pattern.md` even names this gap directly) — and
  `Settings::retention_days()` (default 90 days) already exists as the configurable
  option it should consume. This step fills in the stub and hooks the callback,
  rather than building a parallel mechanism.
- **Photo attachments are not deleted by `PruneSubmissions`.** The spec's
  `SubmissionRetention::deleteSubmission()` walked `answers_json` for attachment IDs
  and deleted them alongside the submission row. `PhotoRetention` (Step 5.13e) already
  owns photo lifecycle independently, driven by attachment post meta and date, not by
  whether a submission row still exists. Coupling the two would introduce a second,
  redundant deletion path for the same attachment.
- **No `optional-details`-step consent checkbox, and no bespoke React component.** The
  spec's Undocumented Assumption Check #1 placed consent on `optional-details`, which
  is deliberately the one step built to be freely skippable
  (`AUDIT-5.14-consent-integration.md`) — the wrong place for a mandatory gate. The
  wizard engine's existing `checkbox` field type and generic required-field
  validation already enforce "cannot submit without checking" with zero new
  component code, once the field sits on each config's actual last mandatory step
  (`contact-and-address` or `address`). The spec's §4.8 bespoke component (local
  `useState`, hand-rolled disabled-state logic) is unnecessary.
- **No inline hyperlink in the consent checkbox label.** Field labels and help text
  are plain strings everywhere in the wizard's rendering layer — a deliberate "no
  presentation" rule, not an oversight. The checkbox references the Privacy Policy in
  plain text; the full policy is one click away via the persistent site footer link,
  visible on the same page throughout the wizard flow (`SiteShell` wraps every route,
  including `/quote`).
- **Lawful basis is consent, not legitimate interest**, as described above — a
  deliberate deviation from the spec's own drafted ADR content, not an oversight.

## Consequences

**Positive:**

- Explicit, timestamped, provable consent for every submission — stronger evidence
  than an inferred lawful basis.
- A real, working privacy policy page, closing a pre-existing dangling footer link.
- Submission retention is no longer a silent no-op stub; the plugin now honours its
  own documented 90-day (default) retention policy.
- No new database migration mechanism, cron infrastructure, or WordPress page-creation
  pattern introduced — everything reuses what Steps 3D/5.13e/5.13g already built.

**Negative / accepted tradeoffs:**

- Consent adds one more required field to every wizard's final step, a small amount
  of additional friction before submission.
- Right to erasure remains a manual, business-owner-driven process (documented in the
  business owner guide) rather than a self-service endpoint.
- No professional legal review of the privacy policy content — flagged explicitly in
  the LLM customization handoff as a pre-production recommendation.
- No automated test exercises `delete_older_than()` against a real MySQL/MariaDB
  instance — there is no reachable database in this environment, consistent with how
  5.13e/5.13g/5.13g's own DB-touching query logic was left as a pending operational
  verification item.

## Not in scope

- Cookie banner / cookie compliance beyond documentation.
- Automated data subject request handling or tracking system.
- Consent revocation mechanism.
- Data breach notification automation.
- Changes to Make.com / Google Sheets / WhatsApp template.
- Professional legal review or certification of the privacy policy content.

## Cross-references

- ADR-0001 (thin WP REST endpoint), ADR-0015 (submission pipeline), ADR-0022 (wizard
  pre-step), ADR-0026 (photo URL storage / retention precedent), ADR-0028 (duplicate
  prevention — the prior step establishing the "Step N" short-circuit pattern reused
  here)
- `AUDIT-5.14-page-creation.md`, `AUDIT-5.14-consent-storage.md`,
  `AUDIT-5.14-consent-integration.md`, `AUDIT-5.14-business-metadata.md`
- `docs/business-owner-data-handling-guide.md`
