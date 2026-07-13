# LLM Customization Handoff Document

**Purpose:** This document is an instruction set for an LLM agent (Claude or equivalent) to
perform per-client customization of the template. Given this document and a business profile
JSON, the LLM produces a fully-customized client deployment of the template's content, SEO, and
wizard configuration. Visual customization is handled separately by the project owner.

**Audience:** LLM agent.

**Codebase state reference:** This document reflects template state at Step 5.13e
(2026-07-13). Always read actual file contents before editing — this document
describes structure and intent, not exact verbatim content.

**Cross-referenced documents:**

- `docs/seo-adaptation-guide.md` — Detailed SEO option reference (Layers 1-4)
- `docs/onboarding.md` — Fresh-clone and deployment procedure
- `docs/fork-procedure.md` — Manual fork-and-customize workflow
- `docs/decisions/0023-seo-infrastructure.md` — SEO architecture decisions

Consult these only when a task references them explicitly. Otherwise work from this document.

---

## Section 1 — Operating Principles

<rules>

### Rule 1 — Scope boundary

You are customizing **content, SEO, and wizard configuration only.** You do NOT modify:

- `plugins/quote-wizard/src/` — All PHP infrastructure (routing, SEO emission, rendering)
- `plugins/quote-wizard/tests/` — All PHP test files
- `plugins/quote-wizard/templates/react-host.php` — WordPress page template
- `apps/wizard/src/domain/` — Wizard engine, validation, pricing, vertical registry
- `apps/wizard/src/runtime/` — React adapter, stores, hooks, submission
- `apps/wizard/src/components/` — All React components (primitives, composites, steps, screens)
- `apps/wizard/src/site/sections/*/index.tsx` — Behavioral section components
- `apps/wizard/src/site/sections/*/Layout.tsx` — Visual layout files
- `apps/wizard/src/site/sections/*/types.ts` — Section type definitions
- `apps/wizard/src/site/sections/ServicesPreview/icons/` — Service icon SVGs
- `apps/wizard/src/site/Footer/index.tsx` — Footer behavioral component
- `apps/wizard/src/site/Footer/Layout.tsx` — Footer visual layout
- `apps/wizard/src/site/Footer/types.ts` — Footer type definitions
- `apps/wizard/src/site/Footer/icons/` — Social media icon SVGs
- `apps/wizard/src/site/routing/` — Client-side routing logic
- `apps/wizard/src/site/layout/` — SiteShell, Header, Nav, SkipLink
- Any `__tests__/` directory, `.test.ts` file, `.test.tsx` file, or `Test.php` file
- Any file under `docs/decisions/` (ADRs)
- `plugins/quote-wizard/assets/og-image-default.png` (replaced separately as a visual task)

### Rule 2 — Modification scope

You modify **only** the following:

- `apps/wizard/src/site/content/site-content.ts` — Site-wide copy (header, nav, contact)
- `apps/wizard/src/site/pages/footer-content.ts` — Footer content (contact, hours, social)
- `apps/wizard/src/site/pages/home-page-content.ts` — Home page section content
- `apps/wizard/src/site/content/services-content.ts` — Services page content
- `apps/wizard/src/site/content/work-content.ts` — Our Work page portfolio entries
- WordPress options via wp-cli (`goqw_*` options — see Section 3 for the full list)

### Rule 3 — Missing information

If the business profile lacks a field that a task requires, leave the **template default** in
place. Log the omission in the customization report (Section 6). Do **not** invent or
hallucinate business information. When in doubt: keep the Acme Fencing default, note it, move on.

### Rule 4 — Verification timing

Verification commands are deferred to Section 8 (Final Verification). Do not run verification
between tasks unless a task explicitly requires it.

### Rule 5 — Output report

After completing all tasks, produce the customization report defined in Section 6 and the
pre-deployment checklist defined in Section 7.

### Rule 6 — File reading before editing

Always read the current content of a file with a file-read tool before editing it. This document
describes the shape and semantics of files, not their exact current content — which may have been
updated since this document was written. Inspect first, then edit.

### Rule 7 — wp-cli context

All `wp option ...` commands run inside the deployed WordPress environment's shell. On LocalWP,
open the site shell from the LocalWP app — `wp` is already on PATH there. On a remote server,
SSH in and run from the WordPress root.

### Rule 8 — TypeScript edits

When editing TypeScript content files, preserve the existing `import` statements at the top of
the file. Replace only the exported constant's value. Do not change type annotations, interface
shapes, or `as const` assertions.

</rules>

---

## Section 2 — Business Profile Schema

<schema>

The business profile is a JSON document. Provide it before starting the tasks.
Required fields are marked `(required)`. Optional fields may be absent — see Rule 3.

```json
{
  "business": {
    "name": "string (required) — trading name of the business",
    "tagline": "string (optional) — short marketing phrase, one sentence",
    "description": "string (required) — 2-4 sentences describing the business, services, and area",
    "yearFounded": "number (optional)"
  },
  "contact": {
    "phones": [
      {
        "label": "string (optional) — e.g. 'Main', 'Mobile', 'Emergency'",
        "number": "string (required) — UK format, e.g. '07712 345 678'"
      }
    ],
    "emails": [
      {
        "label": "string (optional) — e.g. 'Enquiries', 'Admin'",
        "address": "string (required) — valid email address"
      }
    ]
  },
  "location": {
    "address": "string (required) — full postal address, lines separated by literal \\n",
    "serviceArea": "string (required) — e.g. 'Bristol and surrounding areas'",
    "city": "string (optional)",
    "region": "string (optional) — county or region, e.g. 'Surrey'",
    "country": "string (optional, defaults to 'GB')"
  },
  "hours": {
    "description": "string (optional) — multi-line opening hours, e.g. 'Mon-Fri: 8:00-18:00\\nSat: 9:00-14:00\\nSun: Closed'"
  },
  "social": {
    "facebook": "string URL (optional)",
    "instagram": "string URL (optional)",
    "twitter": "string URL (optional)",
    "linkedin": "string URL (optional)"
  },
  "services": {
    "offered": ["string — service IDs from the 11-service library (see Task 3 for full list)"]
  },
  "branding": {
    "priceRange": "string (optional) — schema.org priceRange format, e.g. '££' or '£££'"
  },
  "integration": {
    "webhookUrl": "string URL (optional) — Make.com webhook URL for lead routing"
  },
  "seo": {
    "ogImageUrl": "string URL (optional) — custom 1200x630 Open Graph image, hosted and accessible"
  }
}
```

</schema>

### Sample Business Profile

The following fictional business, **Bright Spark Electricians**, is used as the worked example
throughout this document. Every task shows the expected output for this profile.

```json
{
  "business": {
    "name": "Bright Spark Electricians",
    "tagline": "Bristol's trusted electrical specialists",
    "description": "Bright Spark Electricians provides expert electrical services across Bristol and surrounding areas. From small repairs to full installations, we deliver quality work with safety as our top priority. Established in 2018, fully qualified and insured.",
    "yearFounded": 2018
  },
  "contact": {
    "phones": [
      { "label": "Main", "number": "0117 945 1234" },
      { "label": "Mobile", "number": "07700 900 123" }
    ],
    "emails": [{ "label": "Enquiries", "address": "info@brightspark-electricians.co.uk" }]
  },
  "location": {
    "address": "12 Park Street\nBristol\nBS1 5JL",
    "serviceArea": "Bristol and surrounding areas",
    "city": "Bristol",
    "region": "Bristol",
    "country": "GB"
  },
  "hours": {
    "description": "Mon-Fri: 8:00-18:00\nSat: 9:00-13:00\nSun: Emergency calls only"
  },
  "social": {
    "facebook": "https://facebook.com/brightsparkelectricians",
    "instagram": "https://instagram.com/brightsparkelectricians"
  },
  "services": {
    "offered": ["electrical", "general-repairs"]
  },
  "branding": {
    "priceRange": "££"
  },
  "integration": {
    "webhookUrl": "https://hook.eu1.make.com/example-webhook-id"
  },
  "seo": {
    "ogImageUrl": ""
  }
}
```

The `seo.ogImageUrl` is empty here — no custom OG image. Task 11 handles this case.

---

## Section 3 — Modification Map

<modification_map>

### Template infrastructure — DO NOT MODIFY

| Path                                                   | What it is                                              |
| ------------------------------------------------------ | ------------------------------------------------------- |
| `plugins/quote-wizard/src/`                            | All PHP (routing, SEO emission, rendering, submissions) |
| `plugins/quote-wizard/tests/`                          | PHP Pest test suite                                     |
| `plugins/quote-wizard/templates/react-host.php`        | Minimal WordPress page template                         |
| `apps/wizard/src/domain/`                              | Wizard engine, pricing, vertical registry, validation   |
| `apps/wizard/src/runtime/`                             | React adapter, WizardStore, hooks, http ports           |
| `apps/wizard/src/components/`                          | All React components                                    |
| `apps/wizard/src/site/sections/*/index.tsx`            | Behavioral section components                           |
| `apps/wizard/src/site/sections/*/Layout.tsx`           | Visual section layouts                                  |
| `apps/wizard/src/site/sections/*/types.ts`             | Section type definitions                                |
| `apps/wizard/src/site/sections/ServicesPreview/icons/` | 11 service icon SVGs                                    |
| `apps/wizard/src/site/Footer/index.tsx`                | Footer behavioral component                             |
| `apps/wizard/src/site/Footer/Layout.tsx`               | Footer visual layout                                    |
| `apps/wizard/src/site/Footer/types.ts`                 | Footer types                                            |
| `apps/wizard/src/site/Footer/icons/`                   | Social media icon SVGs (4 icons)                        |
| `apps/wizard/src/site/routing/`                        | Client-side router (Link, Router, routes.ts)            |
| `apps/wizard/src/site/layout/`                         | SiteShell, Header, Nav, SkipLink                        |
| `apps/wizard/src/App.tsx`                              | Entry point (one-liner; do not touch)                   |
| All `__tests__/` directories                           | Vitest test files                                       |
| All `*.test.ts`, `*.test.tsx`                          | Test files                                              |
| All `*Test.php`                                        | PHP test files                                          |
| `docs/decisions/`                                      | ADRs — architectural record; not to be modified         |
| `plugins/quote-wizard/assets/og-image-default.png`     | Default OG image (replace separately)                   |

### Per-client customization points — MODIFY based on business profile

#### TypeScript content files

| File                                               | What it controls                                                                            |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/wizard/src/site/content/site-content.ts`     | Business name in header/nav, tagline, contact block, home page intro copy                   |
| `apps/wizard/src/site/pages/footer-content.ts`     | Footer: phones, emails, address, hours, social links, legal links                           |
| `apps/wizard/src/site/pages/home-page-content.ts`  | All 7 home page sections: Hero, Intro, ServicesPreview, Process, Projects, WhyChooseUs, FAQ |
| `apps/wizard/src/site/content/services-content.ts` | Services page: name, summary, description for each active service                           |
| `apps/wizard/src/site/content/work-content.ts`     | Our Work page: portfolio entries (title, description, serviceId)                            |

#### WordPress options (set via wp-cli)

**Business identity (Layer 2 schema + general):**

| Option key                   | What it controls                                               |
| ---------------------------- | -------------------------------------------------------------- |
| `goqw_business_name`         | Business name for LocalBusiness JSON-LD schema                 |
| `goqw_business_phone`        | Primary telephone for LocalBusiness schema                     |
| `goqw_business_email`        | Primary email for LocalBusiness schema                         |
| `goqw_business_address`      | Multi-line postal address (parsed to PostalAddress sub-schema) |
| `goqw_business_hours`        | Opening hours specification string(s)                          |
| `goqw_business_service_area` | Service area string for `areaServed` field                     |
| `goqw_business_price_range`  | Schema.org `priceRange` (e.g. `££`)                            |

**Social links (Layer 2 schema `sameAs` + footer):**

| Option key              | What it controls           |
| ----------------------- | -------------------------- |
| `goqw_social_facebook`  | Full Facebook profile URL  |
| `goqw_social_instagram` | Full Instagram profile URL |
| `goqw_social_twitter`   | Full X/Twitter profile URL |
| `goqw_social_linkedin`  | Full LinkedIn profile URL  |

**SEO Layer 1 (per-route titles and descriptions):**

| Option key                      | Route                                            |
| ------------------------------- | ------------------------------------------------ |
| `goqw_seo_title_home`           | `/`                                              |
| `goqw_seo_title_services`       | `/services`                                      |
| `goqw_seo_title_our_work`       | `/our-work`                                      |
| `goqw_seo_title_contact`        | `/contact`                                       |
| `goqw_seo_title_quote`          | `/quote`                                         |
| `goqw_seo_description_home`     | `/`                                              |
| `goqw_seo_description_services` | `/services`                                      |
| `goqw_seo_description_our_work` | `/our-work`                                      |
| `goqw_seo_description_contact`  | `/contact`                                       |
| `goqw_seo_description_quote`    | `/quote`                                         |
| `goqw_seo_og_image`             | Custom OG image URL (all routes share one image) |

**Wizard configuration:**

| Option key              | What it controls                               |
| ----------------------- | ---------------------------------------------- |
| `goqw_enabled_services` | Comma-separated list of enabled service IDs    |
| `goqw_webhook_url`      | Make.com webhook URL for submission forwarding |

> **Wizard flow note (Step 5.13c):** The pre-step now collects **postcode only** (`key: postcode`).
> All 7 instant-quote wizard flows end with a `contact-and-address` step that collects name, phone
> (required), email, and `full_address`. The Make.com webhook payload therefore includes
> `full_address` in addition to the fields collected previously. Manual-quote services are
> unaffected.

**Optional overrides:**

| Option key             | What it controls                            |
| ---------------------- | ------------------------------------------- |
| `goqw_sitemap_lastmod` | Override `<lastmod>` date in `/sitemap.xml` |

</modification_map>

---

## Section 4 — Customization Tasks

Execute these tasks in order. Each task is self-contained. Read each task fully before starting.

---

### Task 1 — Business Identity (WordPress Options)

<task id="business-identity">

**Goal:** Configure the business's core identity in WordPress options. These options are read
automatically by `LocalBusinessSchemaEmitter` (Layer 2 SEO) to emit structured JSON-LD.

**Inputs from business profile:**

- `business.name`
- `contact.phones[0].number` (primary phone)
- `contact.emails[0].address` (primary email)
- `location.address`
- `location.serviceArea`
- `hours.description`
- `branding.priceRange`

**Actions:**

Set each option. Use the Bright Spark example values shown:

```bash
wp option update goqw_business_name "Bright Spark Electricians"

wp option update goqw_business_phone "0117 945 1234"

wp option update goqw_business_email "info@brightspark-electricians.co.uk"

# Multi-line address: use $'...' syntax so shell interprets \n as a real newline
wp option update goqw_business_address $'12 Park Street\nBristol\nBS1 5JL'

wp option update goqw_business_service_area "Bristol and surrounding areas"

wp option update goqw_business_hours $'Mon-Fri: 8:00-18:00\nSat: 9:00-13:00\nSun: Emergency calls only'

wp option update goqw_business_price_range "££"
```

**Handling missing data:**

- `contact.phones` absent or empty: skip `goqw_business_phone`. Log in report.
- `contact.emails` absent or empty: skip `goqw_business_email`. Log in report.
- Multiple phones in profile: set `goqw_business_phone` to the first phone.
  All phones appear in the footer (Task 7).
- `hours.description` absent: skip `goqw_business_hours`. Log in report.
- `branding.priceRange` absent: skip `goqw_business_price_range`. Log in report.

**Address format note:**

`goqw_business_address` is parsed by the plugin's `LocalBusinessSchemaEmitter` using a
heuristic:

- Line 0 → `streetAddress`
- Line 1 (when 3+ lines) → `addressLocality`
- Last line → `postalCode`
- `addressCountry` always `"GB"`

A 3-line address like `12 Park Street\nBristol\nBS1 5JL` produces a complete `PostalAddress`
schema. A 2-line address skips `addressLocality`. For non-UK addresses or non-standard formats,
use `goqw_business_address_structured` (a JSON string) instead — this bypasses the heuristic:

```bash
wp option update goqw_business_address_structured \
  '{"@type":"PostalAddress","streetAddress":"12 Park Street","addressLocality":"Bristol","postalCode":"BS1 5JL","addressCountry":"GB"}'
```

**Expected outcome:**

Seven `goqw_business_*` options set. LocalBusiness JSON-LD emits automatically on all React
routes the next time a page loads — no further action required.

</task>

---

### Task 2 — Social Media Links

<task id="social-media">

**Goal:** Configure social media profile URLs in WordPress options. Used by:

- `LocalBusinessSchemaEmitter` — populates the `sameAs` array in LocalBusiness JSON-LD
- Footer content (Task 7) — the footer also reads from `footerContent.social` in TypeScript

The WordPress options are the authoritative source for the schema; the TypeScript footer content
is set independently in Task 7 using the same values.

**Inputs from business profile:**

- `social.facebook`
- `social.instagram`
- `social.twitter`
- `social.linkedin`

**Actions:**

Set only the platforms present in the profile:

```bash
# Bright Spark has Facebook and Instagram only
wp option update goqw_social_facebook "https://facebook.com/brightsparkelectricians"
wp option update goqw_social_instagram "https://instagram.com/brightsparkelectricians"

# twitter and linkedin: NOT set (not in Bright Spark profile)
```

**Handling missing data:**

For any platform not present in the profile: do not set the option. The schema emitter and
footer component silently omit platforms with empty or absent options.

**Expected outcome:**

One `goqw_social_*` option per platform the business has. Missing platforms are absent from
the JSON-LD `sameAs` array and from the footer social links section.

</task>

---

### Task 3 — Wizard Service Availability

<task id="wizard-services">

**Goal:** Configure which of the 11 template services are active for this client. Active
services appear in the wizard service selector and in Service JSON-LD schema. Inactive services
are hidden from both.

**Inputs from business profile:**

- `services.offered[]`

**Service ID reference:**

The valid service IDs are exactly these 11. Any other value is silently ignored by the plugin:

| Service ID        | Display Name          | Category          |
| ----------------- | --------------------- | ----------------- |
| `fencing`         | Fencing               | Landscaping       |
| `decking`         | Decking               | Landscaping       |
| `patio`           | Patio & Paving        | Landscaping       |
| `driveway`        | Driveway              | Landscaping       |
| `steps`           | Garden Steps          | Landscaping       |
| `painting`        | Painting & Decorating | Decorating        |
| `jetwash`         | Pressure Washing      | Exterior Cleaning |
| `general-repairs` | General Repairs       | Handyman Services |
| `plumbing`        | Plumbing              | Handyman Services |
| `electrical`      | Electrical            | Handyman Services |
| `carpentry`       | Carpentry             | Handyman Services |

**Format:** `goqw_enabled_services` is a **comma-separated string**, not JSON.

```bash
# Bright Spark: electrical and general-repairs
wp option update goqw_enabled_services "electrical,general-repairs"
```

The plugin splits on commas and trims whitespace. Order is preserved in the wizard selector.

**Handling missing data:**

- `services.offered` absent or empty: do NOT set `goqw_enabled_services`. Leave it as `''`
  (the seeded default). When empty, all 11 services are shown. Log this in report.
- Any ID in `services.offered` that is not in the 11-service list: skip that ID silently.
  Log the invalid IDs in the report.

**Expected outcome:**

`goqw_enabled_services` contains only the IDs of services this client offers. The wizard
shows only those services, and Service JSON-LD emits one block per active service.

</task>

---

### Task 4 — SEO Layer 1: Per-Route Titles

<task id="seo-titles">

**Goal:** Set a unique, client-appropriate page title for each of the five React routes. These
override the Acme Fencing template defaults in `SEORouteContent.php`.

**Inputs from business profile:**

- `business.name`
- `location.serviceArea` (for homepage title)
- `services.offered[]` (infer primary service category for title copy)

**Title writing guidelines:**

- Target 50-60 characters.
- Pattern: `{Business Name} — {Page Topic}` or `{Page Topic} — {Business Name}`.
- Homepage title: include a key phrase tied to the primary service category and location.
- Avoid generic copy ("Welcome to…"). Each title should signal clearly what the page is about.

**Actions:**

```bash
# Bright Spark: primary category is Electrical + Handyman in Bristol
wp option update goqw_seo_title_home \
  "Bright Spark Electricians — Bristol Electricians & Handyman"

wp option update goqw_seo_title_services \
  "Our Services — Bright Spark Electricians"

wp option update goqw_seo_title_our_work \
  "Our Recent Work — Bright Spark Electricians"

wp option update goqw_seo_title_contact \
  "Contact Bright Spark Electricians — Bristol"

wp option update goqw_seo_title_quote \
  "Get a Free Quote — Bright Spark Electricians"
```

**Route-to-slug mapping (for reference):**

| Route       | Option slug | Option key                |
| ----------- | ----------- | ------------------------- |
| `/`         | `home`      | `goqw_seo_title_home`     |
| `/services` | `services`  | `goqw_seo_title_services` |
| `/our-work` | `our_work`  | `goqw_seo_title_our_work` |
| `/contact`  | `contact`   | `goqw_seo_title_contact`  |
| `/quote`    | `quote`     | `goqw_seo_title_quote`    |

Note: `/our-work` maps to option slug `our_work` (hyphen becomes underscore).

**Handling missing data:**

If the business profile is too sparse to write good titles, construct them from what is available:
`{business.name}` alone is acceptable for secondary pages (`/services`, `/our-work`, `/contact`,
`/quote`). Never leave Acme Fencing in a title option.

**Expected outcome:**

Five `goqw_seo_title_*` options set. `<title>` tags in server-sent HTML reflect the business
on all five React routes.

</task>

---

### Task 5 — SEO Layer 1: Per-Route Descriptions

<task id="seo-descriptions">

**Goal:** Set a unique meta description for each of the five React routes.

**Inputs from business profile:**

- `business.name`
- `business.description`
- `location.serviceArea`
- `services.offered[]`

**Description writing guidelines:**

- Target 130-160 characters.
- Write for the human reader first (affects click-through rate, not rankings).
- Each description should be unique and describe what the visitor finds on that specific page.
- Include the service area on the homepage description; it improves local search relevance.
- Do not keyword-stuff.

**Actions:**

```bash
wp option update goqw_seo_description_home \
  "Expert electrical services across Bristol and surrounding areas. From small repairs to full installations — free quote online."

wp option update goqw_seo_description_services \
  "Electrical installations, fault diagnosis, lighting, sockets, and general handyman repairs. See all services from Bright Spark Electricians."

wp option update goqw_seo_description_our_work \
  "See recent electrical and handyman projects completed by Bright Spark Electricians across Bristol. Quality work guaranteed."

wp option update goqw_seo_description_contact \
  "Contact Bright Spark Electricians for free quotes or to discuss your electrical or repair project. Bristol-based, fast response."

wp option update goqw_seo_description_quote \
  "Get an instant free quote for electrical or handyman services in Bristol. Use our online quote wizard — takes under 2 minutes."
```

**Handling missing data:**

If `business.description` is absent: construct descriptions from `business.name` and
`location.serviceArea` alone. Any description is better than the Acme Fencing default.

**Expected outcome:**

Five `goqw_seo_description_*` options set. Meta description tags reflect the business in
server-sent HTML on all React routes.

</task>

---

### Task 6 — Site-Wide Content (site-content.ts)

<task id="site-content">

**Goal:** Update the site-wide content file. This file controls the business name in the
site header and navigation, the tagline, and the contact block used by any component that
imports from `site-content.ts`.

**File:** `apps/wizard/src/site/content/site-content.ts`

**Read the file first.** The exported `siteContent` constant has this shape (read the actual
`SiteContent` interface before editing):

```typescript
export const siteContent: SiteContent = {
  businessName: '...',
  tagline: '...',
  footerNote: '...',
  contact: {
    phone: '...',
    email: '...',
    address: '...',
    hours: '...',
  },
  home: {
    heading: '...',
    subheading: '...',
    intro: '...',
  },
  nav: {
    ctaLabel: 'Get a free quote', // keep this default
  },
};
```

**Inputs from business profile:**

- `business.name`
- `business.tagline`
- `business.description`
- `contact.phones[0].number`
- `contact.emails[0].address`
- `location.address`
- `hours.description`

**Actions:**

Replace the `siteContent` export values with business-specific content:

```typescript
export const siteContent: SiteContent = {
  businessName: 'Bright Spark Electricians',
  tagline: "Bristol's trusted electrical specialists",
  footerNote: 'Established 2018. Fully qualified and insured. References available.',
  contact: {
    phone: '0117 945 1234',
    email: 'info@brightspark-electricians.co.uk',
    address: '12 Park Street\nBristol\nBS1 5JL',
    hours: 'Mon-Fri: 8:00-18:00\nSat: 9:00-13:00\nSun: Emergency calls only',
  },
  home: {
    heading: "Bristol's Trusted Electrical Specialists",
    subheading: 'Expert electrical services for homes and businesses across Bristol.',
    intro:
      'Bright Spark Electricians provides expert electrical services across Bristol ' +
      'and surrounding areas. From small repairs to full installations, we deliver ' +
      'quality work with safety as our top priority.',
  },
  nav: {
    ctaLabel: 'Get a free quote',
  },
};
```

**Field-by-field guidance:**

- `businessName`: exact trading name from `business.name`.
- `tagline`: use `business.tagline` if present; otherwise construct a short phrase from
  `business.name` + primary service category.
- `footerNote`: a 1-sentence trust signal. If `business.yearFounded` is present, include it
  ("Established {year}"). Otherwise use a qualification/insurance statement.
- `contact.phone`: first phone in `contact.phones[]`.
- `contact.email`: first email in `contact.emails[]`.
- `contact.address`: use `location.address` (multi-line with `\n`).
- `contact.hours`: use `hours.description` if present; otherwise omit (leave empty string).
- `home.heading`: use `business.tagline` or a short headline derived from business description.
- `home.subheading`: 1-sentence summary of `business.description`.
- `home.intro`: 2-3 sentences from `business.description`.
- `nav.ctaLabel`: always keep `'Get a free quote'` — do not change.

**Handling missing data:**

- `business.tagline` absent: construct `home.heading` as `"{service} Specialists in {city}"`.
- `business.description` absent: leave `home.intro` as an empty string; log in report.
- `hours.description` absent: leave `contact.hours` as `''`.
- `contact.phones` absent: leave `contact.phone` as `''`.

**Constraints:**

- Do NOT change the `SiteContent` interface or the `import type` statement.
- Do NOT change `nav.ctaLabel`.
- Preserve the file's structure; replace values only.

**Expected outcome:**

Header and nav show the business name. Home page intro and tagline reflect the business.
Contact details in the site-content block are accurate.

</task>

---

### Task 7 — Footer Content (footer-content.ts)

<task id="footer-content">

**Goal:** Update the footer content file. The footer displays the full contact block —
all phones, all emails, all social links — in a structured layout. This is the most
detail-rich content file.

**File:** `apps/wizard/src/site/pages/footer-content.ts`

**Read the file first.** The `FooterContent` type (from `../Footer/types`) has this shape:

```typescript
// Required
businessName: string
copyrightYear: number
copyrightText: string

// Optional
address?: string
phones?: Array<{ label?: string; number: string }>
emails?: Array<{ label?: string; address: string }>
hours?: string
serviceArea?: string
social?: {
  facebook?: string
  instagram?: string
  twitter?: string
  linkedin?: string
}
legalLinks?: Array<{ label: string; href: string }>
```

**Inputs from business profile:**

- `business.name`
- `contact.phones[]` (all phones)
- `contact.emails[]` (all emails)
- `location.address`
- `location.serviceArea`
- `hours.description`
- `social.*`
- Current year (2026) for `copyrightYear`

**Actions:**

Replace the exported `footerContent` constant:

```typescript
import type { FooterContent } from '../Footer/types';

export const footerContent: FooterContent = {
  businessName: 'Bright Spark Electricians',
  copyrightYear: 2026,
  copyrightText: 'Bright Spark Electricians. All rights reserved.',

  address: '12 Park Street\nBristol\nBS1 5JL',
  phones: [
    { label: 'Main', number: '0117 945 1234' },
    { label: 'Mobile', number: '07700 900 123' },
  ],
  emails: [{ label: 'Enquiries', address: 'info@brightspark-electricians.co.uk' }],
  hours: 'Mon-Fri: 8:00-18:00\nSat: 9:00-13:00\nSun: Emergency calls only',
  serviceArea: 'Bristol and surrounding areas',

  social: {
    facebook: 'https://facebook.com/brightsparkelectricians',
    instagram: 'https://instagram.com/brightsparkelectricians',
  },

  legalLinks: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
};
```

**Field-by-field guidance:**

- `businessName`: exact trading name.
- `copyrightYear`: current year (2026 at time of writing). Update if deploying in a later year.
- `copyrightText`: `"{businessName}. All rights reserved."` unless business specifies different.
- `address`: multi-line using `\n`. Use `location.address` verbatim.
- `phones`: include ALL phones from `contact.phones[]`, preserving labels.
- `emails`: include ALL emails from `contact.emails[]`, preserving labels.
- `hours`: use `hours.description` verbatim.
- `serviceArea`: use `location.serviceArea`.
- `social`: include only platforms with URLs in the profile. Omit platforms not in profile.
- `legalLinks`: keep the default `[Privacy Policy, Terms of Service]` unless the business
  profile specifies different legal pages. These pages do not exist yet — they appear in the
  Pre-Deployment Checklist (Section 7) for the project owner to create.

**Handling missing data:**

- No phones: omit `phones` field (or set to empty array). Log in report.
- No emails: omit `emails` field. Log in report.
- No social profiles: omit `social` field entirely.
- No `hours.description`: omit `hours` field.
- No `location.serviceArea`: omit `serviceArea` field.

**Constraints:**

- Do NOT modify `apps/wizard/src/site/Footer/Layout.tsx`.
- Do NOT modify `apps/wizard/src/site/Footer/index.tsx`.
- Preserve the `import type { FooterContent } from '../Footer/types';` statement.
- Do not add fields not present in the `FooterContent` type.

**Expected outcome:**

Footer displays the business's full contact information, operating hours, social media links,
and legal links. The Acme Fencing placeholder content is gone.

</task>

---

### Task 8 — Home Page Content (home-page-content.ts)

<task id="home-page-content">

**Goal:** Update all seven home page sections with business-appropriate content. This is the
most editorial task — it requires writing copy that reflects the business's identity, services,
and value proposition.

**File:** `apps/wizard/src/site/pages/home-page-content.ts`

**Read the file first.** The file exports `homePageContent: SectionConfig[]` — an array of
section objects. There are seven sections in fixed order:
`hero → intro → services-preview → process → projects → why-choose-us → faq`

**Inputs from business profile:**

- `business.name`, `business.tagline`, `business.description`
- `contact.phones[0]` (for CTA link)
- `location.serviceArea`
- `services.offered[]`
- `business.yearFounded` (optional, for "why choose us")

---

**Section: `hero` (kind: `'hero'`)**

Fields:

- `content.heading` — primary headline. Use `business.tagline` if present; otherwise construct
  from business name.
- `content.subheading` — 1-sentence value proposition.
- `content.primaryCta` — always `{ label: 'Get a free quote', href: '/quote' }`. Do not change.
- `content.secondaryCta` — optional. Use `{ label: 'Call us now', href: 'tel:{phone digits only}' }`.
  If no phone in profile, omit.

Bright Spark example:

```typescript
{
  kind: 'hero',
  id: 'hero',
  content: {
    heading: "Bristol's Trusted Electrical Specialists",
    subheading: 'Expert electrical services for homes and businesses across Bristol.',
    primaryCta: { label: 'Get a free quote', href: '/quote' },
    secondaryCta: { label: 'Call us now', href: 'tel:01179451234' },
  },
},
```

---

**Section: `intro` (kind: `'intro'`)**

Fields:

- `content.heading` — e.g. `"Built by Specialists. Trusted Locally."` or
  `"Why Choose {business.name}?"`.
- `content.body` — 2-4 sentences from `business.description`, expanded if needed.
- `content.bulletPoints` — 4 short trust signals relevant to this business
  (e.g. "Fully qualified & insured", "Fast response", "Free quotes", "Local to Bristol").
- `content.cta` — always `{ label: 'Get a free quote', href: '/quote' }`.

Bright Spark example:

```typescript
{
  kind: 'intro',
  id: 'intro',
  content: {
    heading: 'Expert Electricians. Trusted in Bristol.',
    body:
      'Bright Spark Electricians has been providing expert electrical services across ' +
      'Bristol since 2018. From fault diagnosis to full consumer unit upgrades, we ' +
      'deliver quality work with safety as our top priority. Fully qualified and insured.',
    bulletPoints: [
      'Fully qualified & insured',
      'Fast response times',
      'Free no-obligation quotes',
      'Local to Bristol',
    ],
    cta: { label: 'Get a free quote', href: '/quote' },
  },
},
```

---

**Section: `services-preview` (kind: `'services-preview'`)**

Fields:

- `content.heading` — e.g. `'Our Services'`. Keep short.
- `content.subheading` — 1-sentence tailored to the business.
- `content.services` — array of 4-6 services from `services.offered[]`. If the business
  offers fewer than 4, show all of them.
  Each service entry: `{ serviceId, name, description, iconOrImage, link }`.
  - `serviceId`: must be a valid service ID from the 11-service list.
  - `name`: display name (can differ from the wizard service name if appropriate).
  - `description`: 1-2 sentences describing the service from the client's perspective.
  - `iconOrImage`: use the `serviceId` value (the icon component resolves it automatically).
  - `link`: always `'/quote'`.
- `content.cta` — always `{ label: 'View all services', href: '/services' }`.

Bright Spark example (2 offered services — show both):

```typescript
{
  kind: 'services-preview',
  id: 'services-preview',
  content: {
    heading: 'Our Services',
    subheading: 'Trusted electrical and handyman services across Bristol.',
    services: [
      {
        serviceId: 'electrical',
        name: 'Electrical',
        description: 'Lighting, sockets, consumer units, fault diagnosis, and full installations. Fully qualified electricians.',
        iconOrImage: 'electrical',
        link: '/quote',
      },
      {
        serviceId: 'general-repairs',
        name: 'General Repairs',
        description: 'Handyman repairs and maintenance around the home — describe your job for a free custom quote.',
        iconOrImage: 'general-repairs',
        link: '/quote',
      },
    ],
    cta: { label: 'View all services', href: '/services' },
  },
},
```

**Note on service counts:** If the business offers 6 or more services, select the 4-6 most
prominent for the home page preview. The full list appears on `/services` (Task 9).

---

**Section: `process` (kind: `'process'`)**

Fields:

- `content.heading` — keep template default: `'How It Works'`.
- `content.steps` — 3-step array. Keep the template default steps unless the business profile
  specifies a custom process. The generic 3-step flow (fill in form → receive quote → we
  complete the job) is appropriate for all trade service businesses.

Keep the template default for Bright Spark. No change needed.

---

**Section: `projects` (kind: `'projects'`)**

Fields:

- `content.heading` — tailor to the primary service, e.g.
  `'Our Recent Electrical Work'`.
- `content.subheading` — 1 sentence.
- `content.projects` — update headings and descriptions to match the client's service type.
  Keep placeholder `imageUrl` values — real photos are added manually (Pre-Deployment
  Checklist, Section 7). Update `imageAlt` text to describe the service type.
- `content.cta` — always `{ label: 'View more of our work', href: '/our-work' }`.

Bright Spark example:

```typescript
{
  kind: 'projects',
  id: 'projects',
  content: {
    heading: 'Our Recent Electrical Work',
    subheading: 'See examples of recent installations and repairs completed across Bristol.',
    projects: [
      {
        id: 'p1',
        name: 'Consumer unit upgrade',
        imageUrl: '/images/placeholder-electrical-1.jpg',
        imageAlt: 'Electrical consumer unit installation',
      },
      {
        id: 'p2',
        name: 'New lighting installation',
        imageUrl: '/images/placeholder-electrical-2.jpg',
        imageAlt: 'Modern lighting installation in kitchen',
      },
      {
        id: 'p3',
        name: 'Socket installation',
        imageUrl: '/images/placeholder-electrical-3.jpg',
        imageAlt: 'New socket installation on feature wall',
      },
    ],
    cta: { label: 'View more of our work', href: '/our-work' },
  },
},
```

---

**Section: `why-choose-us` (kind: `'why-choose-us'`)**

Fields:

- `content.heading` — e.g. `'Why Choose Bright Spark Electricians'`.
- `content.valueProps` — array of 4-6 value propositions. Tailor to the business.
  Each: `{ heading: string; description: string }`.
  Generic props like "Reliable & on time", "Transparent pricing", "Fully insured" work for
  any trade business. Add 1-2 specific to the business's primary service category.

Bright Spark example:

```typescript
{
  kind: 'why-choose-us',
  id: 'why-choose-us',
  content: {
    heading: 'Why Choose Bright Spark Electricians',
    valueProps: [
      { heading: 'Fully qualified', description: 'All work carried out by qualified electricians to the latest wiring regulations.' },
      { heading: 'Reliable & on time', description: 'We turn up when we say we will and finish on schedule.' },
      { heading: 'Safety first', description: 'Every job is tested and certified to meet BS 7671 standards.' },
      { heading: 'Transparent pricing', description: 'Clear, honest quotes with no hidden extras.' },
      { heading: 'Fully insured', description: 'Public liability insurance on all work.' },
      { heading: 'Local to Bristol', description: 'Bristol-based team with fast response across the city.' },
    ],
  },
},
```

---

**Section: `faq` (kind: `'faq'`)**

Fields:

- `content.heading` — keep `'Frequently Asked Questions'`.
- `content.items` — array of 4-6 Q&A pairs. Replace fencing-specific questions with
  questions relevant to the business's service type. Generic questions (area covered, free
  quotes, insurance, timeline) work for all trade businesses. Add 1-2 service-specific.
- `content.cta` — always `{ label: 'Get a free quote', href: '/quote' }`.

Bright Spark example:

```typescript
{
  kind: 'faq',
  id: 'faq',
  content: {
    heading: 'Frequently Asked Questions',
    items: [
      {
        id: 'q1',
        question: 'What areas do you cover?',
        answer: "We cover Bristol and surrounding areas. If you're outside this region, get in touch — we can often still help.",
      },
      {
        id: 'q2',
        question: 'Do you offer free quotes?',
        answer: 'Yes, all initial quotes are free via our online wizard or by phone.',
      },
      {
        id: 'q3',
        question: 'Are you fully qualified and insured?',
        answer: 'Yes, we are fully qualified electricians and carry full public liability insurance.',
      },
      {
        id: 'q4',
        question: 'How soon can you start?',
        answer: 'Typically within 1-2 weeks for most jobs. Emergency call-outs are available.',
      },
      {
        id: 'q5',
        question: 'What electrical work do you carry out?',
        answer: 'New lighting, sockets, consumer unit upgrades, fault diagnosis, outdoor circuits, and general repairs. See our services page for the full list.',
      },
    ],
    cta: { label: 'Get a free quote', href: '/quote' },
  },
},
```

**Handling missing data:**

- If `business.tagline` absent: construct `hero.heading` from `business.name`.
- For any section where the business profile doesn't supply specific content: keep template
  defaults and replace only business-name references. Log in report.

**Expected outcome:**

All seven sections reflect the business's identity, service category, and location. The
Acme Fencing copy is fully replaced. Visual layout is untouched.

</task>

---

### Task 8b — Pricing Calibration (Instant-Quote Services)

<task id="pricing-calibration">

**Goal:** Update placeholder pricing constants for each instant-quote service the client
offers. Template values are rough indicative figures; real deployments must be calibrated
to the client's actual rates before going live.

**Files (one per instant-quote service):**

| Service    | Config file                                          |
| ---------- | ---------------------------------------------------- |
| `fencing`  | `apps/wizard/src/domain/fixtures/fencing.config.ts`  |
| `decking`  | `apps/wizard/src/domain/fixtures/decking.config.ts`  |
| `patio`    | `apps/wizard/src/domain/fixtures/patio.config.ts`    |
| `driveway` | `apps/wizard/src/domain/fixtures/driveway.config.ts` |
| `steps`    | `apps/wizard/src/domain/fixtures/steps.config.ts`    |
| `painting` | `apps/wizard/src/domain/fixtures/painting.config.ts` |
| `jetwash`  | `apps/wizard/src/domain/fixtures/jetwash.config.ts`  |

Manual-quote services (`general-repairs`, `plumbing`, `electrical`, `carpentry`) have no
pricing config — they collect contact details only and always produce a custom quote.

**CRITICAL — Integer pence only:** Every monetary value must be a whole number of pence
(1 pence = £0.01). Never use a decimal point. £75.50 = 7550. Floats fail pricing
validation at runtime and the estimate screen will not render for that service.

**What to change in each config file:**

| Field                     | Location in file                       | What it sets                                                   |
| ------------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `base.perUnitPence`       | `xxxPricingConfig.base`                | Price per unit (per metre, per m², per room, per step)         |
| `modifier.effect.factor`  | `xxxPricingConfig.modifiers[n].effect` | Multiplier relative to base (e.g. `1.3` = +30%)                |
| `extra.amountPence`       | `xxxPricingConfig.extras[n]`           | Flat-rate add-on per selected extra                            |
| `bounds.minPence`         | `xxxPricingConfig.bounds`              | Minimum job price floor                                        |
| `bounds.maxPence`         | `xxxPricingConfig.bounds`              | Maximum price ceiling                                          |
| `bounds.rounding.toPence` | `xxxPricingConfig.bounds.rounding`     | Round final price to nearest N pence (e.g. `500` = nearest £5) |

**Example — fencing.config.ts:**

```typescript
// Template placeholder:
base: {
  perUnitPence: 7500, // £75.00 per linear metre
  unit: 'linear_metre',
  quantityFieldId: 'length_m',
},

// After calibration for local market:
base: {
  perUnitPence: 8500, // £85.00 per linear metre
  unit: 'linear_metre',       // DO NOT CHANGE
  quantityFieldId: 'length_m', // DO NOT CHANGE
},
```

**Do NOT change:**

- `base.unit` — the unit string (e.g. `'linear_metre'`, `'square_metre'`, `'item'`)
- `base.quantityFieldId` — field ID supplying the numeric quantity to the pricing engine
- `modifier.id`, `modifier.appliesToFieldId`, `modifier.match` — the modifier wiring
- `extra.id`, `extra.appliesToFieldId`, `extra.match` — the extra wiring
- `schemaVersion`, `currency`, `rangeSpreadBasisPoints`
- Any wizard step definitions, step sequences, or TypeScript type annotations

**Verification:**

After editing pricing configs, run the Vitest suite to confirm validation passes:

```bash
pnpm --filter @growth-ops/wizard exec vitest run
```

All tests should pass. A pricing validation failure means a float was introduced, a
`quantityFieldId` was changed to a non-existent field, or a modifier `factor` was set to
zero or negative. The error output names the failing config and field.

**Scope note:** This task is in the "Manual" column of the Pre-Deployment Checklist because
real-world pricing figures must come from the client. The LLM agent can perform this task
if a pricing table is included in the business profile.

**Expected outcome:**

Each active service's pricing config reflects the client's real rates. The estimate display
shows a plausible price range to users rather than the template placeholder values.

</task>

---

### Task 9 — Services Page and Work Page Content

<task id="content-services-and-work">

**Goal:** Update the services page content and the our-work page portfolio entries to reflect
the client's actual services and previous work.

**Files:**

- `apps/wizard/src/site/content/services-content.ts` — Services page (`/services`)
- `apps/wizard/src/site/content/work-content.ts` — Our Work page (`/our-work`)

Read both files before editing. The `ServiceEntry` type is:

```typescript
{
  id: string;
  name: string;
  summary: string;
  description: string;
}
```

The `WorkEntry` type is:

```typescript
{
  id: string;
  title: string;
  description: string;
  serviceId: string;
}
```

---

**Part A — services-content.ts**

The `services` array contains all 11 template services. For a per-client deployment, filter
this array to include only the services in `services.offered[]`.

For each included service, update the `description` to reflect the client's positioning if the
template description doesn't fit (e.g. if a client specializes in a particular sub-type).
`name` and `summary` can usually stay as template defaults — they are accurate for all clients.

Bright Spark keeps `electrical` and `general-repairs`. Remove the other 9:

```typescript
export const services: readonly ServiceEntry[] = [
  {
    id: 'electrical',
    name: 'Electrical',
    summary: 'Lighting, sockets, fault diagnosis, and consumer units.',
    description:
      'Electrical work including new lighting, socket installation, fault diagnosis, and ' +
      'consumer unit upgrades. All work tested, certified, and completed to BS 7671. ' +
      "Describe your job online and we'll provide a free custom quote.",
  },
  {
    id: 'general-repairs',
    name: 'General Repairs',
    summary: 'Small repairs and odd jobs around the home.',
    description:
      'General handyman repairs and maintenance — from fixing doors and gates to minor ' +
      'plumbing and odd jobs. ' +
      "Describe your job online and we'll send you a custom quote.",
  },
] as const;
```

**Important:** Preserve the `as const` assertion and the `readonly ServiceEntry[]` type.

---

**Part B — work-content.ts**

Update the `works` array to reflect the client's service type. Replace fencing/decking
project titles and descriptions with descriptions appropriate for the client's offered services.
Keep placeholder `serviceId` values pointing to valid service IDs.

Image URLs remain as placeholders (`/images/placeholder-*.jpg`) — real photos are a manual
task in the Pre-Deployment Checklist.

Bright Spark example:

```typescript
export const works: readonly WorkEntry[] = [
  {
    id: 'consumer-unit-upgrade',
    title: 'Consumer unit upgrade — Bristol BS6',
    description:
      '16-way consumer unit upgrade with new RCD protection throughout. ' +
      'Old fuse board removed; full testing and certification completed.',
    serviceId: 'electrical',
  },
  {
    id: 'outdoor-lighting',
    title: 'Outdoor lighting and socket installation',
    description:
      'LED floodlights, pathway lights, and weatherproof outdoor sockets ' +
      'installed for a residential garden in BS9.',
    serviceId: 'electrical',
  },
  {
    id: 'handyman-repairs',
    title: 'General repairs — bathroom and kitchen',
    description:
      'Loose hinges, dripping tap, sticking door, and bathroom cabinet ' +
      'replacement across a two-bed flat.',
    serviceId: 'general-repairs',
  },
] as const;
```

**Handling missing data:**

- If the business has only 1-2 services: include only those in `services-content.ts`.
  For `work-content.ts`, create 3 plausible-but-generic project entries for those service
  types. Do not invent specifics (postcode, client name, exact measurements).
- If the business profile specifies real past projects: use those descriptions.

**Expected outcome:**

`/services` lists only the services the client offers, with descriptions appropriate to their
trade. `/our-work` shows plausible project examples for those services.

</task>

---

### Task 10 — Make.com Webhook URL

<task id="webhook-url">

**Goal:** Configure the Make.com webhook URL so that wizard submissions are forwarded to
the business's Make.com scenario for lead routing.

**Input from business profile:**

- `integration.webhookUrl`

**Actions:**

If `integration.webhookUrl` is present and non-empty:

```bash
wp option update goqw_webhook_url "https://hook.eu1.make.com/example-webhook-id"
```

**Option key:** `goqw_webhook_url` (note: NOT `goqw_make_webhook_url`).

The `Forwarder` class in the plugin reads this option (it also accepts a `GOQW_MAKE_WEBHOOK_URL`
PHP constant in `wp-config.php`, which takes precedence over the option if set).

**Handling missing data:**

If `integration.webhookUrl` absent or empty: do NOT set the option. The wizard will accept
submissions and persist them to the database, but forwarding will fail with a `502` response
to the user. This is a known degraded state. Log this prominently in the report and flag it
in the Pre-Deployment Checklist (Section 7) — the project owner must configure Make.com
before the site goes live.

**Expected outcome:**

Wizard submissions are forwarded to the correct Make.com webhook. Test this end-to-end
in the Pre-Deployment Checklist.

**Photo field note (Step 5.13e):** since ADR-0026, each photo file in the webhook payload
carries `url` and `attachmentId` instead of `dataBase64` — the photo is saved to the
WordPress media library and its public URL is forwarded. If the client's Make.com
scenario or Google Sheets integration was built against the old base64 shape, update the
Google Sheets `IMAGE()` formula to reference the `url` field rather than `dataBase64`.
This is a Make.com scenario config change, not a code change. Photo URLs are public with
no signing or authentication for the pilot (a deliberate tradeoff, not an oversight) —
flag this to the client if photo privacy becomes a concern; it is a candidate for a
future signed-URL or authenticated-media step, not yet built. Photos are retained for 6
months automatically; there is no per-client override for this window yet.

</task>

---

### Task 11 — Open Graph Image (Conditional)

<task id="og-image">

**Goal:** Configure a custom Open Graph image for link previews, if one is available.

**Input from business profile:**

- `seo.ogImageUrl` (only if a hosted image URL is explicitly provided)

**Actions:**

ONLY if `seo.ogImageUrl` is present and non-empty, set the option:

```bash
wp option update goqw_seo_og_image "https://client-domain.co.uk/og-image.png"
```

The image must:

- Be exactly **1200 × 630 pixels**
- Be accessible at the URL (publicly reachable, not behind auth)
- Be under 300 KB in file size
- Be a PNG or JPG

**Handling missing data:**

If no custom OG image is provided: leave `goqw_seo_og_image` unset. The plugin automatically
falls back to `og-image-default.png` — an Acme Fencing branded placeholder. Log this in the
report and flag it in the Pre-Deployment Checklist (Section 7). A branded OG image must be
provided before the site goes live.

**Sitemap lastmod note (optional):**

If the business profile or deployment context specifies a content-last-modified date:

```bash
wp option update goqw_sitemap_lastmod "2026-06-25"
```

This overrides the `<lastmod>` date in `/sitemap.xml`. If not set, the plugin uses
`gmdate('Y-m-d')` (today's date) automatically. Typically leave this unset.

**Expected outcome:**

Either a custom branded OG image is configured, or the default placeholder is in place with
the gap documented in the report.

</task>

---

### Task 12 — Final State Audit

<task id="final-audit">

**Goal:** Audit the completed customization before producing the report and checklist.
Catch omissions, detect remaining Acme Fencing placeholders, confirm scope boundary.

**Actions:**

1. **Read back all `goqw_*` options:**

```bash
wp option list --search='goqw_*' --format=table
```

Review the output. Cross-check against the options listed in Section 3. Confirm that
`goqw_business_name`, `goqw_business_phone`, `goqw_social_*`, and `goqw_seo_title_*` values
reflect the client, not Acme Fencing or placeholder text.

2. **Search for remaining Acme Fencing placeholders in content files:**

```bash
grep -r "Acme Fencing\|acme-fencing\|example\.com\|01234 567 890\|GU1 1AA" \
  apps/wizard/src/site/content/ \
  apps/wizard/src/site/pages/footer-content.ts \
  apps/wizard/src/site/pages/home-page-content.ts
```

Any match indicates a placeholder that was missed. Fix before completing.

3. **Verify scope boundary — no template infrastructure was modified:**

```bash
git diff --name-only apps/wizard/src/domain/
git diff --name-only apps/wizard/src/runtime/
git diff --name-only apps/wizard/src/components/
git diff --name-only apps/wizard/src/site/sections/
git diff --name-only apps/wizard/src/site/Footer/index.tsx
git diff --name-only apps/wizard/src/site/Footer/Layout.tsx
git diff --name-only apps/wizard/src/site/routing/
git diff --name-only plugins/quote-wizard/src/
```

Each command should produce no output. If any of these paths appear in the diff, you
have violated the scope boundary — revert those changes before completing.

4. **Verify content files were modified:**

```bash
git diff --name-only apps/wizard/src/site/content/
git diff --name-only apps/wizard/src/site/pages/footer-content.ts
git diff --name-only apps/wizard/src/site/pages/home-page-content.ts
```

Should show the content files you edited in Tasks 6-9.

5. **Identify sections left as template defaults:**

Review the audit output and note any sections that retain generic template copy (process
steps, FAQ items, etc.) because the business profile didn't specify alternatives. These
should be listed in the "Defaults Left in Place" section of the report.

6. **Collect report data:** All information gathered here feeds directly into Section 6
   (Customization Report).

**Expected outcome:**

No Acme Fencing placeholders remain in any content file. Scope boundary respected.
Report data collected. Ready to produce Section 6 output.

</task>

---

## Section 5 — When to Consult Other Documents

Consult external documents only when a task explicitly directs you to, or when you encounter
a gap that this document does not cover.

| Situation                                                                                        | Document to read                                                             |
| ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Need to understand a SEO option in depth (what it does, how it's emitted, verification commands) | `docs/seo-adaptation-guide.md`                                               |
| Need to understand the address heuristic or PostalAddress structured override                    | `docs/seo-adaptation-guide.md` §Layer 2                                      |
| Need to understand how the `robots_txt` filter or `/sitemap.xml` rewrite works                   | `docs/decisions/0023-seo-infrastructure.md`                                  |
| Need to understand what a specific wizard service config does                                    | Read `apps/wizard/src/domain/fixtures/{serviceId}.config.ts` — DO NOT modify |
| Need to understand the overall deployment procedure                                              | `docs/onboarding.md` §Deploying the plugin                                   |
| Need to understand the fork-and-customize workflow                                               | `docs/fork-procedure.md`                                                     |
| Encountered a wp-cli error related to the Make.com webhook                                       | `docs/make-com-integration.md`                                               |

---

## Section 6 — Customization Report Template

After completing all 12 tasks (including Task 12 audit), produce a report with this structure.
Fill in the bracketed fields from your actual outputs.

---

<report_template>

```markdown
# Customization Report: {Business Name}

**Date:** {today's date}
**Business profile source:** {file path or "inline JSON"}
**Tasks completed:** {count}/12

---

## WordPress Options Set

| Option Key                      | Value Set            |
| ------------------------------- | -------------------- |
| `goqw_business_name`            | "{value}"            |
| `goqw_business_phone`           | "{value}"            |
| `goqw_business_email`           | "{value}"            |
| `goqw_business_address`         | "{first line...}"    |
| `goqw_business_hours`           | "{first line...}"    |
| `goqw_business_service_area`    | "{value}"            |
| `goqw_business_price_range`     | "{value or NOT SET}" |
| `goqw_social_facebook`          | "{value or NOT SET}" |
| `goqw_social_instagram`         | "{value or NOT SET}" |
| `goqw_social_twitter`           | "{value or NOT SET}" |
| `goqw_social_linkedin`          | "{value or NOT SET}" |
| `goqw_seo_title_home`           | "{value}"            |
| `goqw_seo_title_services`       | "{value}"            |
| `goqw_seo_title_our_work`       | "{value}"            |
| `goqw_seo_title_contact`        | "{value}"            |
| `goqw_seo_title_quote`          | "{value}"            |
| `goqw_seo_description_home`     | "{truncated...}"     |
| `goqw_seo_description_services` | "{truncated...}"     |
| `goqw_seo_description_our_work` | "{truncated...}"     |
| `goqw_seo_description_contact`  | "{truncated...}"     |
| `goqw_seo_description_quote`    | "{truncated...}"     |
| `goqw_enabled_services`         | "{value or NOT SET}" |
| `goqw_webhook_url`              | "{value or NOT SET}" |
| `goqw_seo_og_image`             | "{value or NOT SET}" |

---

## TypeScript Files Modified

- `apps/wizard/src/site/content/site-content.ts` — {summary of changes}
- `apps/wizard/src/site/pages/footer-content.ts` — {summary of changes}
- `apps/wizard/src/site/pages/home-page-content.ts` — {summary of changes}
- `apps/wizard/src/site/content/services-content.ts` — {summary of changes}
- `apps/wizard/src/site/content/work-content.ts` — {summary of changes}

---

## Defaults Left in Place

The following were left as template defaults because the business profile did not specify
alternatives:

- {e.g. "Process section steps — generic 3-step flow kept"}
- {e.g. "FAQ — generic questions kept; no client-specific questions provided"}
- {e.g. "Project photos — placeholder imageUrls kept; real photos are a manual task"}
- {e.g. "goqw_business_price_range — not set; business profile did not specify price range"}

---

## Warnings and Omissions

{List any missing data items encountered, e.g.:}

- "Business profile did not include hours; `goqw_business_hours` not set."
- "Business profile `services.offered` contained invalid ID 'roofing'; skipped."
- "No custom OG image provided; placeholder in place."

---

## Scope Boundary Verification

- Template infrastructure modified: {YES — list files / NO}
- If YES, revert required before deployment.

---

## Required Visual Customization (Manual — Project Owner)

The following are out of scope for this LLM customization pass and must be completed manually:

- **OG image:** {NOT SET — branded 1200×630 PNG required before launch / or CONFIGURED at {url}}
- **Service icons:** SVGs in `apps/wizard/src/site/sections/ServicesPreview/icons/` are
  template line icons. Replace if custom icons required.
- **Section visual design:** `Layout.tsx` files are untouched. Use the 21st.dev workflow to
  apply visual customization if required.
- **Real project photos:** `work-content.ts` uses placeholder image paths.
  Replace with actual client photos and update `imageUrl` values.
- **Pricing calibration:** Wizard pricing is template placeholder. Review per-service pricing
  configs in `apps/wizard/src/domain/wizards/` with the client and adjust.
- **Privacy Policy and Terms pages:** Footer links to `/privacy` and `/terms`. Create these
  WordPress pages or update `footerContent.legalLinks` to remove the links.
- **Make.com scenario:** {CONFIGURED / NOT CONFIGURED — configure before launch}
```

</report_template>

---

## Section 7 — Pre-Deployment Checklist

Complete all items on this checklist before deploying the site publicly. Items marked
(LLM) were handled in this customization pass. Items marked (Manual) require project owner
action.

<checklist>

### LLM Customization Pass (completed above)

- [x] (LLM) Business identity WP options set (`goqw_business_*`)
- [x] (LLM) Social media WP options set (`goqw_social_*`)
- [x] (LLM) Wizard service availability configured (`goqw_enabled_services`)
- [x] (LLM) Per-route SEO titles set (`goqw_seo_title_*`)
- [x] (LLM) Per-route SEO descriptions set (`goqw_seo_description_*`)
- [x] (LLM) `site-content.ts` updated with business identity
- [x] (LLM) `footer-content.ts` updated with contact details and social links
- [x] (LLM) `home-page-content.ts` updated for all 7 sections
- [x] (LLM) `services-content.ts` filtered to offered services
- [x] (LLM) `work-content.ts` updated with service-appropriate portfolio entries
- [x] (LLM) Webhook URL configured (or omission logged)
- [x] (LLM) OG image configured (or omission logged)

### Manual — Content and Visual

- [ ] (Manual) **OG image:** Replace `og-image-default.png` with branded 1200×630 image, OR
      ensure `goqw_seo_og_image` points to a publicly accessible branded image.
- [ ] (Manual) **Service icons:** Replace SVG icons in
      `apps/wizard/src/site/sections/ServicesPreview/icons/` if custom icons are required.
- [ ] (Manual) **Real project photos:** Replace placeholder `imageUrl` values in
      `work-content.ts` and `home-page-content.ts` projects sections with hosted client photos.
- [ ] (Manual) **Section visual design:** Use the 21st.dev workflow to customize
      `Layout.tsx` files (colors, typography, spacing) if the template visual defaults are
      not suitable for this client.
- [ ] (Manual) **Pricing calibration:** Review per-service pricing configs in
      `apps/wizard/src/domain/fixtures/` with the client (see Task 8b). Adjust
      `perUnitPence`, modifier `factor` values, and extra `amountPence` to reflect
      real-world pricing. Run `pnpm --filter @growth-ops/wizard exec vitest run` to verify.

### Manual — WordPress Setup

- [ ] (Manual) **WordPress site title and tagline:** WordPress Admin → Settings → General.
      Set `Site Title` and `Tagline` to match the business. These appear in some browser tabs
      and RSS feeds.
- [ ] (Manual) **Admin email:** Settings → General → Administration Email Address.
      Set to the client's admin email (not the developer's).
- [ ] (Manual) **Timezone:** Settings → General → Timezone. Set to `Europe/London` for UK
      deployments.
- [ ] (Manual) **Privacy Policy page:** Create a WordPress page at `/privacy` with the
      client's privacy policy, or update `footerContent.legalLinks` to remove the link.
- [ ] (Manual) **Terms of Service page:** Create a WordPress page at `/terms`, or update
      `footerContent.legalLinks` to remove the link.
- [ ] (Manual) **Permalink flush:** WordPress Admin → Settings → Permalinks → click Save.
      Required for `/sitemap.xml` route to register after plugin activation.

### Manual — Integration and Infrastructure

- [ ] (Manual) **Make.com scenario:** Verify the webhook URL in `goqw_webhook_url` routes
      to an active Make.com scenario. Test with a real submission end-to-end.
- [ ] (Manual) **DNS:** Point the client's domain to the deployment environment.
- [ ] (Manual) **SSL certificate:** Configure HTTPS. Required for all production deployments.
- [ ] (Manual) **WordPress URL settings:** If switching from a local dev URL to a production
      domain, update WordPress's `siteurl` and `home` options.

### Manual — Verification

- [ ] (Manual) **View-source on all 5 routes:** Confirm `<title>`, `<meta name="description">`,
      `<link rel="canonical">`, and `application/ld+json` blocks reflect the client.
- [ ] (Manual) **Test wizard submission end-to-end:** Submit a test quote with a real email
      address; confirm Make.com receives it and the client's email workflow triggers.
- [ ] (Manual) **Run Google Rich Results Test:** Paste each React route URL into the Google
      Rich Results Test tool. Confirm LocalBusiness and Service structured data validates.
- [ ] (Manual) **Verify `/sitemap.xml`:** Visit `https://client-domain.co.uk/sitemap.xml`.
      Confirm 5 `<url>` entries are present with correct `<loc>` values.
- [ ] (Manual) **Verify `robots.txt`:** Visit `https://client-domain.co.uk/robots.txt`.
      Confirm `Sitemap:` directive is present.
- [ ] (Manual) **Submit to Google Search Console:** After DNS and SSL are live, add the
      property and submit the sitemap URL.
- [ ] (Manual) **Mobile viewport check:** View the site on a narrow viewport (320-375px).
      Confirm layout does not overflow horizontally.
- [ ] (Manual) **OG preview tools:** Test Open Graph link preview appearance at
      `https://www.opengraph.xyz/` or `https://metatags.io/`.

</checklist>

---

## Section 8 — Final Verification Commands

Run these after completing all 12 tasks. They confirm the customization landed correctly.

<verification>

### V1 — Business identity options

```bash
wp option list --search='goqw_business_*' --format=table
```

Confirm: all options reflect the client. No empty values for required fields.

### V2 — Social media options

```bash
wp option list --search='goqw_social_*' --format=table
```

Confirm: each platform the client has is set to their URL. Absent platforms are missing
(that is correct — do not set empty URLs).

### V3 — Enabled services

```bash
wp option get goqw_enabled_services
```

Confirm: comma-separated list of service IDs matching `services.offered[]` from the profile.

### V4 — SEO titles

```bash
wp option list --search='goqw_seo_title_*' --format=table
```

Confirm: all 5 titles reflect the client's business name. No "Acme Fencing" in any value.

### V5 — SEO descriptions

```bash
wp option list --search='goqw_seo_description_*' --format=table
```

Confirm: all 5 descriptions are set and mention the client's service area or service type.

### V6 — Webhook URL

```bash
wp option get goqw_webhook_url
```

Confirm: Make.com webhook URL is set and matches the client's scenario URL.
If empty, this is flagged for manual setup (see Pre-Deployment Checklist).

### V7 — Content files modified

```bash
git diff --stat apps/wizard/src/site/content/
git diff --stat apps/wizard/src/site/pages/footer-content.ts
git diff --stat apps/wizard/src/site/pages/home-page-content.ts
```

Confirm: all five content files show changes (`site-content.ts`, `footer-content.ts`,
`home-page-content.ts`, `services-content.ts`, `work-content.ts`).

### V8 — Template infrastructure untouched

```bash
git diff --name-only apps/wizard/src/domain/
git diff --name-only apps/wizard/src/runtime/
git diff --name-only apps/wizard/src/components/
git diff --name-only apps/wizard/src/site/sections/
git diff --name-only apps/wizard/src/site/Footer/index.tsx apps/wizard/src/site/Footer/Layout.tsx
git diff --name-only apps/wizard/src/site/routing/
git diff --name-only plugins/quote-wizard/src/
```

Each command should return **no output**. If any paths appear, the scope boundary was
violated — revert those changes.

### V9 — No Acme Fencing placeholders

```bash
grep -r "Acme Fencing\|acme-fencing\|example\.com\|01234 567 890\|GU1 1AA" \
  apps/wizard/src/site/content/ \
  apps/wizard/src/site/pages/footer-content.ts \
  apps/wizard/src/site/pages/home-page-content.ts
```

Should return **no output**. Any match is an unfixed placeholder.

### V10 — Sitemap (optional, post-deployment only)

```bash
# Run this only after deploying to a real WordPress environment:
curl -s http://your-site.local/sitemap.xml | head -20
```

Should return valid XML with 5 `<url>` entries.

</verification>

---

## Appendix A — Content File Structure Reference

This appendix provides the authoritative TypeScript structure of each customizable content
file. Read this if you are unsure what fields a type accepts.

### site-content.ts — SiteContent

```typescript
interface SiteContent {
  readonly businessName: string;
  readonly tagline: string;
  readonly footerNote: string;
  readonly contact: {
    readonly phone: string;
    readonly email: string;
    readonly address: string;
    readonly hours: string;
  };
  readonly home: {
    readonly heading: string;
    readonly subheading: string;
    readonly intro: string;
  };
  readonly nav: {
    readonly ctaLabel: string; // always 'Get a free quote'
  };
}
```

### footer-content.ts — FooterContent

```typescript
interface FooterContent {
  // Required
  businessName: string;
  copyrightYear: number;
  copyrightText: string;

  // Optional
  address?: string; // multi-line with \n
  phones?: Array<{ label?: string; number: string }>;
  emails?: Array<{ label?: string; address: string }>;
  hours?: string; // multi-line with \n
  serviceArea?: string;
  social?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  legalLinks?: Array<{ label: string; href: string }>;
}
```

### home-page-content.ts — SectionConfig[]

The array may contain these section kinds, in any order (but conventional order is as in the
template):

```typescript
// 'hero'
{ kind: 'hero'; id: string; content: {
  heading: string;
  subheading: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  backgroundImage?: string;
  backgroundImageAlt?: string;
}}

// 'intro'
{ kind: 'intro'; id: string; content: {
  heading: string;
  body: string;
  bulletPoints?: string[];
  cta?: { label: string; href: string };
}}

// 'services-preview'
{ kind: 'services-preview'; id: string; content: {
  heading: string;
  subheading?: string;
  services: Array<{
    serviceId: string;
    name: string;
    description: string;
    iconOrImage: string;   // use the serviceId value
    link: string;          // always '/quote'
  }>;
  cta?: { label: string; href: string };
}}

// 'process'
{ kind: 'process'; id: string; content: {
  heading: string;
  steps: Array<{ stepNumber: number; name: string; description: string }>;
}}

// 'projects'
{ kind: 'projects'; id: string; content: {
  heading: string;
  subheading?: string;
  projects: Array<{ id: string; name: string; imageUrl: string; imageAlt: string }>;
  cta?: { label: string; href: string };
}}

// 'why-choose-us'
{ kind: 'why-choose-us'; id: string; content: {
  heading: string;
  valueProps: Array<{ heading: string; description: string }>;
}}

// 'faq'
{ kind: 'faq'; id: string; content: {
  heading: string;
  items: Array<{ id: string; question: string; answer: string }>;
  cta?: { label: string; href: string };
}}
```

### services-content.ts — ServiceEntry[]

```typescript
interface ServiceEntry {
  readonly id: string; // must be a valid service ID from the 11-service list
  readonly name: string;
  readonly summary: string; // one sentence
  readonly description: string; // 2-4 sentences
}
```

### work-content.ts — WorkEntry[]

```typescript
interface WorkEntry {
  readonly id: string; // unique slug, e.g. 'consumer-unit-upgrade'
  readonly title: string; // project title
  readonly description: string; // 2-3 sentences describing the job
  readonly serviceId: string; // must be a valid service ID from the 11-service list
}
```

---

## Appendix B — Option Key Quick Reference

All WordPress options that this document references, in one place.

```
goqw_business_name              — Business name (LocalBusiness schema + site identity)
goqw_business_phone             — Primary telephone (LocalBusiness schema)
goqw_business_email             — Primary email (LocalBusiness schema)
goqw_business_address           — Multi-line postal address (PostalAddress heuristic)
goqw_business_address_structured — JSON PostalAddress override (bypasses heuristic)
goqw_business_hours             — Opening hours spec string(s)
goqw_business_service_area      — areaServed field in LocalBusiness schema
goqw_business_price_range       — priceRange field (e.g. '££')
goqw_social_facebook            — Facebook profile URL (sameAs + footer)
goqw_social_instagram           — Instagram profile URL (sameAs + footer)
goqw_social_twitter             — X/Twitter profile URL (sameAs + footer)
goqw_social_linkedin            — LinkedIn profile URL (sameAs + footer)
goqw_seo_title_home             — <title> for /
goqw_seo_title_services         — <title> for /services
goqw_seo_title_our_work         — <title> for /our-work
goqw_seo_title_contact          — <title> for /contact
goqw_seo_title_quote            — <title> for /quote
goqw_seo_description_home       — <meta name="description"> for /
goqw_seo_description_services   — <meta name="description"> for /services
goqw_seo_description_our_work   — <meta name="description"> for /our-work
goqw_seo_description_contact    — <meta name="description"> for /contact
goqw_seo_description_quote      — <meta name="description"> for /quote
goqw_seo_og_image               — Custom OG image URL (all routes)
goqw_enabled_services           — Comma-separated enabled service IDs
goqw_webhook_url                — Make.com webhook URL for submission forwarding
goqw_sitemap_lastmod            — Optional: override <lastmod> date in /sitemap.xml
```

---

## Appendix C — Common Mistakes and How to Avoid Them

### Mistake 1: Setting `goqw_enabled_services` as a JSON array

❌ Wrong:

```bash
wp option update goqw_enabled_services '["electrical", "general-repairs"]'
```

✅ Correct:

```bash
wp option update goqw_enabled_services "electrical,general-repairs"
```

The PHP plugin parses this as a comma-separated string, not JSON. A JSON value produces
no matching service IDs and all 11 services are shown.

---

### Mistake 2: Using `goqw_make_webhook_url` instead of `goqw_webhook_url`

❌ Wrong:

```bash
wp option update goqw_make_webhook_url "https://hook.eu1.make.com/..."
```

✅ Correct:

```bash
wp option update goqw_webhook_url "https://hook.eu1.make.com/..."
```

The option key is `goqw_webhook_url`. The Make.com context is implied; the option name does
not include "make".

---

### Mistake 3: Editing `Layout.tsx` files

❌ Wrong: editing `apps/wizard/src/site/sections/Hero/Layout.tsx` to change content copy.

✅ Correct: editing `apps/wizard/src/site/pages/home-page-content.ts` to update the content
that the `Layout.tsx` renders. Layout files render whatever content is passed to them —
update the content, not the renderer.

---

### Mistake 4: Wrong path for services-content.ts

❌ Wrong path: `apps/wizard/src/site/pages/services-content.ts` (does not exist)

✅ Correct path: `apps/wizard/src/site/content/services-content.ts`

Similarly: `site-content.ts` and `work-content.ts` are in `apps/wizard/src/site/content/`,
not in `apps/wizard/src/site/pages/`. Only `footer-content.ts` and `home-page-content.ts`
are in `apps/wizard/src/site/pages/`.

---

### Mistake 5: Setting an empty-string social option

❌ Wrong: setting `goqw_social_twitter ""` for a business that has no Twitter.

✅ Correct: do not set the option at all (leave it at its seeded default of `''`). The schema
emitter and footer both treat empty string as "absent" and omit the platform silently. Setting
an explicit `""` is functionally the same, but unnecessarily pollutes the options table.

---

### Mistake 6: Using the wrong `our-work` slug

❌ Wrong option key: `goqw_seo_title_our-work` (with a hyphen)

✅ Correct option key: `goqw_seo_title_our_work` (with an underscore)

The route `/our-work` maps to slug `our_work` (hyphen becomes underscore). Using a hyphen
produces an unrecognized option that is silently ignored, leaving the Acme Fencing default.

---

_End of LLM Customization Handoff Document_

_Codebase state: Step 5.13e (2026-07-13). Pre-step postcode-only; photo upload + contact-and-address step added to all instant-quote services; submission photos stored to the media library as public URLs with 6-month retention (ADR-0026)._
_Next planned update: after Step 5.14 (SCB deployment)_
