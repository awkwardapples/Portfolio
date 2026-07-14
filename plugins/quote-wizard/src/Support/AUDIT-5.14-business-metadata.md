# Audit D — Existing Business/Client Metadata (5.14)

Date: 2026-07-14
Step: 5.14 Phase 0 Audit D

## Files examined

`plugins/quote-wizard/src/Support/Settings.php`, `plugins/quote-wizard/src/Activator.php`,
`plugins/quote-wizard/src/SEO/LocalBusinessSchemaEmitter.php`, `apps/wizard/src/site/content/site-content.ts`,
`apps/wizard/src/site/pages/footer-content.ts`.

## Two separate business-identity stores already exist — pick the client-side one

There are, in fact, two places business identity data already lives, serving two different
consumers:

1. **WordPress options via `Settings.php`** (`goqw_business_name`, `goqw_business_phone`,
   `goqw_business_email`, plus SEO-only options `goqw_business_address`, `goqw_business_hours`,
   `goqw_business_service_area`, `goqw_business_price_range` read directly by
   `LocalBusinessSchemaEmitter` without a `Settings` getter). These feed `PublicConfig::build()` →
   `window.GOQW_CONFIG` (consumed by the **wizard itself** — business name/phone/email shown
   inside the quote flow) and the LocalBusiness JSON-LD schema emitted into `wp_head`.
2. **Static TypeScript content files** — `site-content.ts`'s `siteContent` object
   (`businessName`, `tagline`, `contact.{phone,email,address,hours}`) and `footer-content.ts`'s
   `footerContent` object (business name, address, phones, emails, hours, social links,
   `legalLinks`). These feed the **marketing site** (`ContactPage.tsx`, `FooterLayout`, `HomePage`)
   — all client-side routes rendered without any request to the WordPress REST/options layer.

The privacy policy page is a marketing-site route (`/privacy`, per `AUDIT-5.14-page-creation.md`),
so it belongs with store (2), not store (1). Reading business identity from `Settings`/`PublicConfig`
would require either a new REST-exposed config field (more surface area, another entry in
`PublicConfig::build()`'s explicit allowlist) or server-side templating that doesn't exist anywhere
in this client-rendered route system — both unnecessary when `siteContent` already holds
`businessName`, `contact.email`, and `contact.address`, already imported directly by sibling pages
like `ContactPage.tsx`.

## No new placeholder scheme needed

The spec's §4.2 proposes `{{BUSINESS_NAME}}` / `{{BUSINESS_EMAIL}}` / `{{BUSINESS_ADDRESS}}` /
`{{DATE_LAST_UPDATED}}` placeholders inside a PHP-generated content template, resolved at
activation time. Given the privacy policy is a plain React component
(`PrivacyPolicyPage.tsx`), it can simply `import { siteContent } from '@/site/content/site-content'`
and interpolate `siteContent.businessName`, `siteContent.contact.email`,
`siteContent.contact.address` directly in JSX — the same "edit this file to adapt the template for
a new client" convention every other marketing page already follows (`site-content.ts`'s own header
comment). Per-client customization of the privacy policy's business identity is therefore already
covered by the existing instruction to edit `site-content.ts`; no separate placeholder-substitution
step is needed, and `docs/llm-customization-handoff.md`'s new task should say so rather than
describing a wp-admin Pages edit flow that does not apply to this route (see
`AUDIT-5.14-page-creation.md`).

`DATE_LAST_UPDATED` has no existing equivalent anywhere in the codebase (nothing else is
date-stamped this way) — this one placeholder is genuinely new. It is implemented as a plain string
constant inside `PrivacyPolicyPage.tsx` (e.g. `const LAST_UPDATED = '14 July 2026';`), updated by
hand whenever the policy's substance changes — documented as a manual step in both the privacy
policy content and the LLM customization handoff.
