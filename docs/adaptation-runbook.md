# Adaptation Runbook

How to clone the Quote Wizard template and adapt it for a new client.

**Audience:** A developer (typically the project owner) working from a fresh
clone of this repository for a new client deployment. Assumes comfort with git,
pnpm, TypeScript, WordPress CLI, and editing TypeScript config files.

**Scope:** Adapting an existing template clone using the capabilities available
as of Step 5.3 (post-OV-001 verification). Covers site content, services list,
portfolio, wizard service configuration, branding (primary color), and LocalWP
deployment.

**Out of scope:**

- Make.com workflow setup. See `docs/make-com-integration.md`.
- Visual customization beyond primary color: navbar variants, background tinting,
  layout variants, optional widgets (Google Reviews badge, call-now bar). These
  arrive in Step 5.6+, scoped by real first-client feedback.
- Production hosting deployment on IONOS (Step 6.0 documentation).
- Adding new React pages beyond the existing five-route structure (structural
  constant — see `docs/product-vision.md`).

**Reading flow:** Read top to bottom when working through a new client
adaptation for the first time. Once familiar, the file-map reference at the end
can be used as a quick lookup.

**Last updated:** June 6, 2026

---

## Prerequisites

Before starting, have these ready:

- Git access to the template repository and push rights for the client's repo.
- Node.js 20.x and pnpm 9.x installed (see `package.json` `engines` field for
  exact versions).
- PHP 8.1 and Composer 2.x installed (for plugin gate verification).
- LocalWP (or equivalent local WordPress environment) for testing.
- WP-CLI — LocalWP provides a site shell where `wp` is available. Use it.
- The client's basic information:
  - Business name and tagline
  - Contact details (phone, email, address, hours)
  - List of services they offer (for the site pages)
  - Which of those services should have a wizard quote flow (may be a subset)
  - Any approximate pricing structure for the wizarded services
  - Primary brand color (hex)

You do not need Make.com credentials, IONOS hosting credentials, or production
access at this stage. Make.com configuration is covered in
`docs/make-com-integration.md`; production hosting deployment is Step 6.0.

---

## Architecture overview

Two minutes of context prevents hours of confusion. The React application has
two distinct halves:

**`apps/wizard/src/site/`** — the website shell. This is the part you edit per
client. It contains:

- `src/site/content/` — three TypeScript modules with all editorial content.
  Edit these to adapt the template.
- `src/site/pages/` — five page components (Home, Services, Our Work, Contact,
  Quote). Do not add or remove pages without reading the onboarding guide.
- `src/site/routing/` — the static route table. Five routes; this is a
  structural constant.
- `src/site/layout/` — SiteShell, Header, Nav, Footer. Do not edit per-client.

**`apps/wizard/src/components/`, `src/runtime/`, `src/domain/`** — the quote
wizard widget. Shared infrastructure; do not touch per-client. The wizard is
embedded in the `/quote` page by `QuotePage.tsx`.

**`plugins/quote-wizard/`** — the WordPress plugin. Hosts the built React
bundle, serves the five-route SPA, handles quote submissions, and injects
per-deployment configuration (`window.GOQW_CONFIG`) into the browser.

**The two configuration surfaces:**

| Surface              | Where it lives                            | What it controls                                                      |
| -------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| Compile-time content | TypeScript modules in `src/site/content/` | What the visitor sees: names, copy, services, portfolio               |
| Runtime config       | WordPress options (`goqw_*`)              | Per-deployment: primary color, which wizard to use, Make.com endpoint |

These surfaces do different jobs and change on different cadences. The
TypeScript content is compiled into the bundle and deployed as an artifact; the
WordPress options are set in the WordPress admin or via WP-CLI after deployment.

**ESLint boundary:** `src/site/**` files may NOT import from
`@/domain/runtime/**` or `@/domain/pricing/**`. These are the wizard's internal
concerns. Site code uses the registry (`@/domain/registry`) and the React
adapter (`@/runtime`). The boundary is enforced by ESLint and fails `pnpm lint`
if violated.

---

## Step 1 — Clone the template repository

```bash
git clone <template-repo-url> riverside-plumbing
cd riverside-plumbing
pnpm install
composer install --working-dir=plugins/quote-wizard
```

Verify the gates pass on a fresh clone before making any changes:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build-plugin
composer --working-dir=plugins/quote-wizard test
```

If any gate fails on a fresh clone, halt and investigate before proceeding. The
template HEAD should always be green. A gate failure on a fresh clone is a
finding in the template, not something to work around.

Expected gate output:

- `pnpm lint` — 0 errors, 0 warnings
- `pnpm typecheck` — 0 errors
- `pnpm test` — all tests pass (count matches what `docs/current-state.md`
  reports)
- `pnpm build-plugin` — clean build; check the reported gzip size is reasonable
- `composer test` — all PHP tests pass

**What NOT to do:**

- Do not fork via GitHub's "Use this template" button if you intend to receive
  upstream template updates later. Use `git clone` and add the template
  repository as a remote called `template`:
  ```bash
  git remote add template <template-repo-url>
  ```
  Then `git fetch template` will work when you need to pull in future template
  improvements.
- Do not start editing before confirming the gates pass. Any latent failure
  becomes noise against your own changes.
- Do not delete the `.git/` directory. The history is the documentation. ADR
  amendments and commit messages explain why things are the way they are.

---

## Step 2 — Adapt site content

**What it controls:** The visitor-facing text on all five pages — business name,
tagline, contact details, home page hero copy, and footer credentials.

**File:** `apps/wizard/src/site/content/site-content.ts`

This file exports a single `siteContent` constant typed as `SiteContent`. The
interface is defined at the top of the file — read it first to see every field.

**All fields:**

| Field             | What it controls                          | Notes                                                      |
| ----------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `businessName`    | Header logo text; footer attribution      | Displayed in nav and footer                                |
| `tagline`         | Subheading below the logo in the header   | Short, 1–2 sentences                                       |
| `footerNote`      | Footer line (certifications, credentials) | Gas Safe reg number, insurance, etc.                       |
| `contact.phone`   | Phone number on Contact page and footer   | Format consistently with client preference                 |
| `contact.email`   | Email address on Contact page             | Do not use a personal email; use the business address      |
| `contact.address` | Address block; use `\n` for line breaks   | Three-line format: street, town, postcode                  |
| `contact.hours`   | Operating hours on Contact page           | Include emergency line if the client has one               |
| `home.heading`    | Home page `<h1>`                          | Operational, not marketing. State what they do.            |
| `home.subheading` | Home page secondary heading below the H1  | Action prompt; what the visitor should do next             |
| `home.intro`      | Home page introduction paragraph          | 2–4 sentences; what the business does, for whom            |
| `nav.ctaLabel`    | CTA button label in the nav and hero      | Default: `'Get a free quote'`; adjust to client preference |

**Example — Riverside Plumbing & Heating:**

```typescript
export const siteContent: SiteContent = {
  businessName: 'Riverside Plumbing & Heating',
  tagline: 'Reliable plumbing across the Thames Valley.',
  footerNote: 'Gas Safe registered (no. 123456). Fully insured.',
  contact: {
    phone: '01491 123 456',
    email: 'hello@riversideplumbing.example',
    address: 'Unit 3, Riverside Estate\nHenley-on-Thames\nRG9 1AB',
    hours: 'Mon–Fri 8:00–18:00. Emergency line: 07700 900 000.',
  },
  home: {
    heading: 'Honest quotes for plumbing and heating.',
    subheading: 'Describe your job. Free estimates within 24 hours.',
    intro:
      'We install, repair, and service plumbing and heating systems for homes and small ' +
      'businesses across the Thames Valley. Use the quote tool to describe your project — ' +
      'we will follow up with a written estimate within one working day.',
  },
  nav: {
    ctaLabel: 'Get a free quote',
  },
};
```

**After editing:** Run `pnpm typecheck`. If you omit a required field or use
the wrong type, typecheck fails with a specific error pointing to the problem.
The interface is your specification.

**What NOT to do:**

- Do not add new fields to the `siteContent` object. The shape is fixed by the
  `SiteContent` interface. If a field is genuinely missing for this client,
  that is a code change discussion, not a content edit.
- Do not put HTML in any field. All values are plain strings. Multi-line
  addresses use `\n`. Multi-paragraph content is not supported in this file —
  use the right page component instead.
- Do not use marketing language, hyperbole, emojis, or brand-voice patterns.
  Per ADR-0012: operational English, plain and direct. "Honest quotes for
  plumbing" not "The Thames Valley's #1 Plumbing Experience™".
- Do not set `contact.phone` to a personal mobile as the primary number. Use
  the client's business number.

---

## Step 3 — Adapt the services list

**What it controls:** The service tiles displayed on the Home page (preview
section) and the full Services page (`/services`). This is display content only
— it does not control which services appear in the quote wizard. The wizard
configuration is Step 5.

**File:** `apps/wizard/src/site/content/services-content.ts`

The file exports a `services` array of `ServiceEntry` objects:

```typescript
interface ServiceEntry {
  readonly id: string; // stable cross-reference ID
  readonly name: string; // displayed service name
  readonly summary: string; // short description (used in the preview tile)
  readonly description: string; // full description (used on the Services page)
}
```

Replace the template entries with the client's actual services:

**Example — Riverside Plumbing:**

```typescript
export const services: readonly ServiceEntry[] = [
  {
    id: 'boiler-installation',
    name: 'Boiler installation and replacement',
    summary: 'Gas and oil boilers. Full installation including flue and controls.',
    description:
      'We install and replace all types of domestic boiler — combi, system, and heat-only ' +
      'models. Work includes new flue, controls, and commissioning. Most jobs completed in ' +
      'one day. Gas Safe registered.',
  },
  {
    id: 'central-heating',
    name: 'Central heating systems',
    summary: 'Full system design, installation, and servicing.',
    description:
      'Central heating design and installation for new builds and complete replacements. ' +
      'We specify the right system for the property and handle pipework, radiators, ' +
      'controls, and commissioning.',
  },
  {
    id: 'bathroom-plumbing',
    name: 'Bathroom plumbing',
    summary: 'Taps, basins, baths, showers, and WCs.',
    description:
      'Bathroom plumbing for new installations and refits. We work alongside your builder ' +
      'or decorator, or manage the full job. All work is tested and signed off.',
  },
  {
    id: 'emergency-plumbing',
    name: 'Emergency plumbing',
    summary: 'Same-day call-out for leaks, blockages, and burst pipes.',
    description:
      'Emergency call-outs for leaks, blocked drains, burst pipes, and no hot water. ' +
      'We aim to attend within two hours during business hours. Emergency line available ' +
      'outside business hours.',
  },
] as const;
```

**Choosing service IDs:**

- Use kebab-case: `'boiler-installation'` not `'boilerInstallation'` or
  `'boiler_installation'`.
- IDs are stable cross-references. The `work-content.ts` portfolio file (Step 4)
  uses these IDs to associate portfolio entries with services. If you change a
  service ID after adding portfolio entries, you must update those entries too.
- The display services list can be a **superset** of the wizard services. A
  client may list emergency call-outs or other services on the page without
  having a wizard vertical for them — visitors would call or email for those.
  This is intentional and common.

**What NOT to do:**

- Do not reuse the template IDs `'fencing'` or `'decking'` for a different
  service. Those IDs are semantically meaningful; reusing them for plumbing
  would mislead the cross-reference system.
- Do not leave `description` empty. At a minimum, one sentence of operational
  content.
- Do not write `summary` and `description` with overlapping content. Summary is
  the one-liner for the tile; description is the full explanation for the page.

---

## Step 4 — Adapt the portfolio

**What it controls:** The work entries displayed on the `/our-work` page. Each
entry describes a completed project and cross-references the service it belongs
to.

**File:** `apps/wizard/src/site/content/work-content.ts`

```typescript
interface WorkEntry {
  readonly id: string; // stable unique identifier for this entry
  readonly title: string; // displayed project title
  readonly description: string; // project description (1–3 sentences)
  readonly serviceId: string; // must match an id in services-content.ts
}
```

Replace the template entries with real (or representative placeholder) project
entries for the client:

**Example — Riverside Plumbing:**

```typescript
export const works: readonly WorkEntry[] = [
  {
    id: 'boiler-replace-henley',
    title: 'Combi boiler replacement — Henley-on-Thames',
    description:
      'Replaced an aging back boiler and separate hot water cylinder with a new Worcester ' +
      'Bosch 30i combi boiler. New flue through external wall, Honeywell T6 smart thermostat, ' +
      'one-year servicing plan included. Completed in one day.',
    serviceId: 'boiler-installation',
  },
  {
    id: 'central-heating-reading',
    title: 'Full central heating system — Reading',
    description:
      'Designed and installed a new central heating system in a four-bedroom terraced house. ' +
      'Twelve radiators, underfloor heating in kitchen and bathroom, Worcester Bosch system boiler.',
    serviceId: 'central-heating',
  },
  {
    id: 'bathroom-marlow',
    title: 'Bathroom refit plumbing — Marlow',
    description:
      'Full bathroom refit: walk-in shower, freestanding bath, twin basins. Worked alongside ' +
      'a bathroom specialist. All work certified.',
    serviceId: 'bathroom-plumbing',
  },
] as const;
```

**For a first deployment with no completed client projects:** Use 2–3
representative placeholder entries describing the kind of work the client does.
These will be replaced with real project entries as the client accumulates work.
The portfolio page is designed to grow over time.

**Images:** The current template is text-only. Per the product vision, image
support in portfolio entries is deferred to Step 5.6+ (when visual customization
is built, scoped by real first-client feedback). Do not add `imageSrc` or
similar fields to `WorkEntry` — the interface is fixed and `z.strictObject`-
validated.

**Cross-reference integrity:** Every `serviceId` in `work-content.ts` must match
an `id` in `services-content.ts`. TypeScript does not enforce this (both are
plain strings), but the content integration test does. Run `pnpm test` after
editing both files. If the test fails with a cross-reference error, the message
identifies exactly which entry has a mismatched `serviceId`.

**What NOT to do:**

- Do not reference a `serviceId` that does not exist in `services-content.ts`.
- Do not invent project details that are not representative of the client's
  actual work. The portfolio is a trust signal; exaggerated entries undermine it.
- Do not use the `id` field for human-readable titles. It is a stable unique
  identifier and is not displayed to visitors.

---

## Step 5 — Configure wizard services

This step configures which services appear in the quote wizard and what questions
each service asks. It is separate from Step 3 (display services).

The wizard is the interactive quote form at `/quote`. Visitors use it to describe
a job and get an estimate. Not every displayed service needs a wizard vertical —
a client can list emergency call-outs on the site without taking wizard leads for
them. But every wizarded service must have a registered vertical with a wizard
config and a pricing config.

Two sub-tasks:

- **5a:** Remove the reference verticals (fencing, decking) if the client does
  not offer those services.
- **5b:** Add new service verticals for the client's actual services.

For most clients you will do both.

---

### 5a — Removing reference verticals

Two approaches; choose based on whether you want a code change or a runtime
option.

**Option A — WordPress option (no code change):**

Set `goqw_enabled_services` to the IDs of only the verticals you want to offer.
Fencing and decking remain compiled into the bundle but are never shown to
visitors.

```bash
# From LocalWP site shell
wp option update goqw_enabled_services 'boiler-installation'
```

When the option contains exactly one ID, the ServiceSelector screen is bypassed
and the wizard opens directly on that service. This is the expected setup for
most single-trade clients.

This is the fastest path for initial testing. Use it to test your new vertical
before removing the reference verticals from the codebase.

**Option B — Remove from the registry (code change):**

Delete the unwanted entry from `VERTICALS` in
`apps/wizard/src/domain/registry/verticals.ts`.

To remove decking from a plumbing client's deployment:

```typescript
// Before:
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { deckingWizardConfig, deckingPricingConfig } from '@/domain/fixtures/decking.config';

const fencing: Vertical = {
  /* ... */
};
const decking: Vertical = {
  /* ... */
};

export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  decking,
});

export const FALLBACK_VERTICAL_ID = 'fencing' as const;

// After (decking removed, new vertical added):
import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import {
  boilerInstallationWizardConfig,
  boilerInstallationPricingConfig,
} from '@/domain/fixtures/boiler-installation.config';

const fencing: Vertical = {
  /* ... */
};
const boilerInstallation: Vertical = {
  /* ... */
};

export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  'boiler-installation': boilerInstallation,
});

export const FALLBACK_VERTICAL_ID = 'boiler-installation' as const;
```

If you remove **all** reference verticals, update `FALLBACK_VERTICAL_ID` to
point at one of your client's verticals. The fallback is used when the WordPress
option `goqw_wizard_id` is missing or references an unknown vertical.

**Find all references before removing:**

```bash
grep -r 'decking' apps/wizard/src/ --include='*.ts' --include='*.tsx' -l
```

Scan each result. Most references in test files are to the decking fixture
(which you can leave in the codebase even after removing it from the registry).
The files that matter functionally are:

- `verticals.ts` — the registry entry and its import
- Any tests that specifically assert the registry's contents

The fixture file `decking.config.ts` is a teaching example and is not harmful
to keep in the repo. Only the registry entry needs to go.

**After making changes:** Run `pnpm test`. If tests fail, the error messages
will identify exactly which assertions need updating. Most commonly, registry-
content tests assert which verticals are present; update those assertions to
match your new set.

**What NOT to do:**

- Do not delete the fixture file (`fencing.config.ts`, `decking.config.ts`)
  from `apps/wizard/src/domain/fixtures/`. These are canonical teaching examples
  and reference implementations. Keep them in the repo even if they're not in
  the registry.
- Do not leave `FALLBACK_VERTICAL_ID` pointing at a vertical you removed. The
  runtime will silently fail to resolve the fallback.
- Do not try to hide a vertical by setting `label` to an empty string or
  similar. Use `goqw_enabled_services` (Option A) or remove the registry entry
  (Option B).

---

### 5b — Adding a new service vertical

Adding a vertical means adding one TypeScript config file plus one registry
entry. No other files change.

A vertical consists of two configs shipped together in one file:

- **WizardConfig** — what steps and questions appear in the wizard
- **PricingConfig** — how to compute a price estimate from the answers

Read `apps/wizard/src/domain/fixtures/fencing.config.ts` before writing your
own. It is the canonical reference, with explanatory comments on every section.
The decking config is a second, lighter reference example.

---

#### Worked example: Riverside Plumbing "Boiler installation" service

**Step 1: Create the config file.**

`apps/wizard/src/domain/fixtures/boiler-installation.config.ts`

```typescript
/**
 * VERTICAL: boiler-installation — Riverside Plumbing & Heating.
 *
 * Wizard: boiler type, quantity, extras, photos, contact, review.
 * Pricing: per-boiler base rate with type modifiers and removal extra.
 *
 * MONEY: all monetary values are INTEGER PENCE. £1,500 = 150000.
 * IDS vs LABELS: id/key/value are stable contracts; label/title are copy.
 */

import type { WizardConfig } from '@/domain/config/wizard-config';
import type { PricingConfig } from '@/domain/config/pricing';

export const boilerInstallationWizardConfig: WizardConfig = {
  schemaVersion: 1,
  id: 'boiler-installation',
  title: 'Boiler installation quote',
  steps: [
    {
      id: 'boiler',
      title: 'Your boiler',
      description: 'Tell us about the boiler you need.',
      fields: [
        {
          id: 'boiler_type',
          key: 'boiler_type',
          type: 'radio',
          label: 'Boiler type',
          required: true,
          options: [
            { value: 'combi', label: 'Combi boiler' },
            { value: 'system', label: 'System boiler' },
            { value: 'heat_only', label: 'Heat-only (regular) boiler' },
          ],
        },
        {
          id: 'num_boilers',
          key: 'num_boilers',
          type: 'number',
          label: 'Number of boilers',
          help: 'Usually 1. Enter 2 or more for multi-unit installations.',
          required: true,
        },
      ],
    },
    {
      id: 'extras',
      title: 'Extras',
      description: 'Optional additions to your quote.',
      fields: [
        {
          id: 'remove_old',
          key: 'remove_old',
          type: 'checkbox',
          label: 'Remove the existing boiler',
          required: false,
          options: [{ value: 'yes', label: 'Yes, remove and dispose of the old boiler' }],
        },
      ],
    },
    {
      id: 'site_photos',
      title: 'Site photos',
      description:
        'Photos of the existing boiler and installation area help us assess access and pipework.',
      fields: [
        {
          id: 'site_photos',
          key: 'site_photos',
          type: 'photo',
          label: 'Photos of the installation area (optional)',
          maxCount: 5,
          required: false,
          help: 'Up to 5 photos. JPEG, PNG, or WebP.',
        },
      ],
    },
    {
      id: 'contact',
      title: 'Your details',
      description: 'Where should we send your quote?',
      fields: [
        {
          id: 'contact_name',
          key: 'contact_name',
          type: 'text',
          label: 'Your name',
          required: true,
        },
        {
          id: 'contact_email',
          key: 'contact_email',
          type: 'text',
          label: 'Email address',
          required: true,
        },
        {
          id: 'contact_phone',
          key: 'contact_phone',
          type: 'text',
          label: 'Phone number',
          required: false,
        },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Check your answers before we prepare your quote.',
      fields: [
        {
          id: 'review_summary',
          key: 'review_summary',
          type: 'review',
          label: 'Your answers',
          required: false,
        },
      ],
    },
  ],
};

export const boilerInstallationPricingConfig: PricingConfig = {
  schemaVersion: 1,
  currency: 'GBP',
  base: {
    label: 'Base installation cost per boiler',
    perUnitPence: 150000, // £1,500 per boiler installed
    unit: 'item',
    quantityFieldId: 'num_boilers',
  },
  modifiers: [
    {
      id: 'type_system',
      label: 'System boiler (additional pipework)',
      appliesToFieldId: 'boiler_type',
      match: { kind: 'equals', value: 'system' },
      effect: { kind: 'multiply', factor: 1.2 },
    },
    {
      id: 'type_heat_only',
      label: 'Heat-only (regular) boiler (most complex)',
      appliesToFieldId: 'boiler_type',
      match: { kind: 'equals', value: 'heat_only' },
      effect: { kind: 'multiply', factor: 1.3 },
    },
  ],
  extras: [
    {
      id: 'removal',
      label: 'Remove and dispose of existing boiler',
      appliesToFieldId: 'remove_old',
      match: { kind: 'equals', value: 'yes' },
      amountPence: 15000, // £150 flat
    },
  ],
  bounds: {
    minPence: 100000, // £1,000 minimum job
    maxPence: 1000000, // £10,000 ceiling
    rounding: {
      mode: 'nearest',
      toPence: 5000, // round to nearest £50
    },
  },
  rangeSpreadBasisPoints: 2000, // ±20% (plumbing has higher variability than fencing)
};
```

**Step 2: Register the vertical.**

In `apps/wizard/src/domain/registry/verticals.ts`, add the import and a new
entry:

```typescript
import {
  boilerInstallationWizardConfig,
  boilerInstallationPricingConfig,
} from '@/domain/fixtures/boiler-installation.config';

// ...

const boilerInstallation: Vertical = {
  id: 'boiler-installation', // must match wizardConfig.id exactly
  label: 'Boiler installation',
  schemaVersion: 1,
  wizard: boilerInstallationWizardConfig,
  pricing: boilerInstallationPricingConfig,
};

export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  decking,
  'boiler-installation': boilerInstallation, // object key matches the id
});
```

The `id` on the `Vertical` constant must match the `id` in the
`WizardConfig`. These are separate fields and the registry validator confirms
they agree.

**Step 3: Add a validation test.**

Create
`apps/wizard/src/domain/fixtures/__tests__/boiler-installation-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateWizardConfig, validatePricingConfig } from '@/domain/validation/validate';
import {
  boilerInstallationWizardConfig,
  boilerInstallationPricingConfig,
} from '@/domain/fixtures/boiler-installation.config';

describe('boiler-installation config', () => {
  it('passes wizard validation', () => {
    const result = validateWizardConfig(boilerInstallationWizardConfig);
    expect(result.ok).toBe(true);
  });

  it('passes pricing validation against the wizard', () => {
    const result = validatePricingConfig(
      boilerInstallationPricingConfig,
      boilerInstallationWizardConfig,
    );
    expect(result.ok).toBe(true);
  });

  it('contains 5 steps in expected order', () => {
    expect(boilerInstallationWizardConfig.steps.map((s) => s.id)).toEqual([
      'boiler',
      'extras',
      'site_photos',
      'contact',
      'review',
    ]);
  });
});
```

**Step 4: Run the gates.**

```bash
pnpm typecheck   # type-checks the new config against WizardConfig / PricingConfig
pnpm test        # runs the validation tests including your new one
pnpm build-plugin
```

---

#### Schema rules quick reference

| Rule                                                   | What it means                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Both `id` and `key` are required on every field        | Use identical values: `id: 'contact_name', key: 'contact_name'`                               |
| `id` format: `^[a-z][a-z0-9_-]*$`                      | Lowercase, starts with a letter; hyphens and underscores allowed                              |
| `schemaVersion: 1` on both configs                     | Do not change; version bumps are a deliberate migration event                                 |
| `options` required for `radio`, `select`, `checkbox`   | Omitting it causes the cross-reference validation to fail                                     |
| `maxCount` on `photo` fields only                      | Ignored on other field types; `z.strictObject` rejects unknown keys                           |
| All money is integer pence                             | £1,500.00 = `150000`. No floats. Ever.                                                        |
| `quantityFieldId` must reference a `number`-type field | The pricing engine reads it as a number; pointing at a `text` or `radio` field produces `NaN` |
| `appliesToFieldId` must reference a field that exists  | The cross-reference validator checks this and fails with a specific error                     |

**Available field types:**

| Type       | Use for                                                          |
| ---------- | ---------------------------------------------------------------- |
| `text`     | Single-line free text                                            |
| `textarea` | Multi-line free text                                             |
| `select`   | Choose one from a dropdown list                                  |
| `radio`    | Choose one from visible option buttons                           |
| `checkbox` | Boolean opt-in, or multi-select set                              |
| `number`   | Numeric entry (used as quantity field in pricing)                |
| `photo`    | Image upload (supports `maxCount` 1–5)                           |
| `review`   | Terminal summary field; exactly one per wizard, in the last step |

The `review` field type renders a summary of all answers and the estimated
price range. It must appear in the last step and must be the only field in that
step. The `contact` step always precedes `review`.

**For advanced features** (conditional fields using `condition:`, the `in` and
`always` match kinds in pricing, `add`-effect modifiers, `notEmpty`/`notEquals`
operators), read the source schemas directly — they are authoritative and
extensively commented:

- `apps/wizard/src/domain/config/wizard-config.ts`
- `apps/wizard/src/domain/config/pricing.ts`

Do not duplicate their content in this runbook; the schemas are the single
source of truth. Use `fencing.config.ts` as a concrete teaching example
alongside them.

**What NOT to do:**

- Do not use the type annotation `z.infer<typeof WizardConfigSchema>` in your
  config file. Use the exported alias `WizardConfig`. Same for `PricingConfig`.
- Do not add unknown keys to config objects. The schema uses `z.strictObject`
  and an unknown key (for example `helpText` instead of `help`) fails with an
  "Unrecognized key(s)" error, not a silent miss.
- Do not skip writing the validation test. The test is how the CI gate confirms
  the config is valid. Without it, a malformed config can be committed and only
  fail at runtime in production.
- Do not copy `appliesToFieldId` values from another config without checking
  they match actual field IDs in your new wizard. Cross-reference errors only
  surface at validation time, not at TypeScript compile time.
- Do not put a `review` field anywhere except the final step. Multiple `review`
  fields in one wizard produce undefined behavior.

---

## Step 6 — Set per-deployment WordPress options

These options live in the WordPress install, not in the code. They control
per-deployment behavior: which services to offer, what color the buttons are,
and where submissions go (Make.com webhook URL).

Set them via WP-CLI from LocalWP's site shell (the "Open site shell" button in
the LocalWP UI). All `goqw_*` options are seeded with safe defaults when the
plugin is activated.

**Key options:**

| Option                  | What it controls                                                                                                                       | Default                                                |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `goqw_wizard_id`        | The vertical to use as the default when only one service is enabled, or as the fallback when `wizardId` in the request is unresolvable | `'fencing'` (template default; update for each client) |
| `goqw_enabled_services` | Comma-separated list of vertical IDs to offer. Empty string = offer all registered verticals                                           | `''` (all)                                             |
| `goqw_primary_color`    | Primary brand color applied to CTA buttons and interactive elements                                                                    | `'#0F4C81'`                                            |
| `goqw_webhook_url`      | Make.com webhook URL for forwarding submissions                                                                                        | `''` (disabled; see `docs/make-com-integration.md`)    |

**Example — Riverside Plumbing with a single boiler service:**

```bash
# Set the primary wizard
wp option update goqw_wizard_id 'boiler-installation'

# Offer only the boiler installation service (bypasses the service selector)
wp option update goqw_enabled_services 'boiler-installation'

# Riverside Plumbing brand color
wp option update goqw_primary_color '#E85D2B'
```

**Single-service clients:** Setting `goqw_enabled_services` to exactly one ID
bypasses the ServiceSelector screen. The wizard opens immediately on that
service. This is the expected setup for most first-client deployments where the
client wants leads for one trade.

**Multi-service clients:** List all vertical IDs the client wants to expose,
comma-separated:

```bash
wp option update goqw_enabled_services 'boiler-installation,central-heating'
```

When two or more services are enabled, the visitor first sees a service selector
screen before the wizard steps. The list is filtered to only IDs that exist in
the compiled registry — unknown IDs are silently dropped at runtime.

**Primary color:** The default is `#0F4C81` (navy blue). The client's brand
color replaces it. Check that the chosen color has adequate contrast against
white text (WCAG AA minimum: 4.5:1 ratio). The color is applied to CTA buttons
and interactive focus states; it does not affect typography, backgrounds, or
layout (those come in Step 5.6).

**Verifying the options are set:**

```bash
wp option get goqw_wizard_id
wp option get goqw_enabled_services
wp option get goqw_primary_color
```

**What NOT to do:**

- Do not treat `goqw_wizard_id` and `goqw_enabled_services` as interchangeable.
  `wizardId` is the fallback; `enabled_services` controls what is shown.
  A vertical not in `enabled_services` is never shown even if it is the
  `wizardId`.
- Do not set site content (business name, contact details) in WP options instead
  of editing `site-content.ts`. The WP options are runtime config, not editorial
  content. They do not control what the visitor sees on the site pages.
- Do not set `goqw_webhook_url` to a test or staging Make.com scenario URL in
  the production WordPress install. Keep staging and production as separate
  WordPress installs with separate options.
- Do not skip setting `goqw_primary_color`. Leaving it at the default navy
  (`#0F4C81`) when the client has a different brand color produces a mismatched
  first impression.

---

## Step 7 — Deploy to LocalWP for testing

Follow the deploy procedure documented in `docs/onboarding.md` under the heading
**"Deploying the plugin to a WordPress install (Step 5.2)"**. That section
documents the full procedure with every step and common pitfalls.

The procedure in brief:

1. Build from a clean working tree: `pnpm install && pnpm -r build`
2. Verify the manifest (all `file` entries are relative paths — no drive letters)
3. Deactivate the existing plugin: `wp plugin deactivate quote-wizard`
4. Delete the existing plugin: `wp plugin delete quote-wizard`
5. Copy `plugins/quote-wizard/` into `wp-content/plugins/`
6. Activate: `wp plugin activate quote-wizard`
7. Clear caches: `wp cache flush && wp transient delete --all`
8. Verify: `wp plugin list` — confirm the version matches `GOQW_VERSION`

**Always deactivate → delete → redeploy as a unit.** Do not copy individual
files over a live plugin directory. Mixed file versions from partial deploys
produce unpredictable failures and are the hardest class of bug to diagnose.

After deploying, set the per-deployment options (Step 6) before testing.

---

## Step 8 — Verify the adapted template

Run this checklist after deploying to LocalWP and setting per-deployment options.

### Site shell

- [ ] Home page (`/`) loads in the browser.
- [ ] Business name in the nav header matches `siteContent.businessName`.
- [ ] Tagline in the header matches `siteContent.tagline`.
- [ ] Home hero heading and intro paragraph are correct.
- [ ] CTA button label is correct (default: "Get a free quote").
- [ ] Services page (`/services`) loads. Listed service names and descriptions
      match `services-content.ts`.
- [ ] Our Work page (`/our-work`) loads. Portfolio entries are present.
- [ ] Contact page (`/contact`) loads. Phone, email, address, and hours are
      correct.
- [ ] Quote page (`/quote`) loads.
- [ ] Footer note matches `siteContent.footerNote`.

### Wizard

- [ ] Navigating to `/quote` shows either the ServiceSelector (if multiple
      services are enabled) or opens the wizard directly (if one service is enabled).
- [ ] The wizard runs through all steps to completion for each enabled service.
- [ ] The contact step collects name, email, and (optional) phone.
- [ ] If the config includes a photo step, it renders and accepts uploads.
- [ ] The review step shows a summary of all answers and the estimated price range.
- [ ] Submitting a completed wizard creates a row in `wp_goqw_submissions`.

Verify the submission row via WP-CLI (from LocalWP site shell):

```bash
wp db query "SELECT id, wizard_id, status, created_at FROM wp_goqw_submissions ORDER BY id DESC LIMIT 5;"
```

Expected: a row with `wizard_id = 'boiler-installation'` (or your service ID),
`status = 'forward_failed'` (correct — Make.com is not configured yet), and a
recent `created_at` timestamp.

### Visual

- [ ] The CTA button and interactive elements use the client's brand color
      (not the template default `#0F4C81`).

### Expected behavior without Make.com

The submission endpoint returns `502` when `goqw_webhook_url` is empty —
this is correct. The row is persisted in `wp_goqw_submissions` and is safe.
The `502` response means "persisted, but forward to Make.com failed." This is
the expected state for all test submissions until Make.com is configured (see `docs/make-com-integration.md`).

---

## What's deferred in this runbook

**Make.com configuration:** Connecting each submission to a Make.com workflow
(notifications, CRM entry, spreadsheet logging) is not covered here. See
`docs/make-com-integration.md` for the complete setup guide. Until Make.com is
configured, submissions are safely held in `wp_goqw_submissions`.

**Visual customization beyond primary color (Step 5.6+):** Navbar style variants
(light/dark), background image or tinting, layout variants on the Home page,
optional widgets (Google Reviews badge, call-now bar) — all deferred until
Step 5.5 surfaces what real first-client feedback requires. See
`docs/product-vision.md` for the intended variation surface and
`docs/technical-debt.md` for the deferred scope and trigger.

**Production hosting on IONOS (Step 6.0):** The adaptation process above targets
a LocalWP test environment. Step 6.0 covers the production deployment procedure
to IONOS shared hosting. The same deploy procedure applies; the environment
differs.

**Pricing complexity:** The pricing schema supports conditions, multiple extras,
multiplicative and additive modifiers, and `in`/`always` match operators. The
minimum viable config in the worked example above uses a small subset. For a
client with complex pricing rules (e.g., a price that varies based on answers to
multiple questions), read `apps/wizard/src/domain/config/pricing.ts` for the
full schema and `fencing.config.ts` for a moderately complex example.

**Interactive pricing configuration tool:** Considered and deferred. For now, a
developer edits the TypeScript pricing config directly. If direct editing becomes
a bottleneck across multiple clients, see `docs/technical-debt.md` for the
deferred item and trigger condition.

---

## Common pitfalls

**Browser and server caches.** After every deploy: flush the WP cache
(`wp cache flush`), delete transients (`wp transient delete --all`), and hard-
reload in the browser (Ctrl+Shift+R or clear site data). Cached old assets are
the most common cause of "my change isn't showing up." This is especially
insidious because a cached old CSS file can produce correct text but broken
layout.

**Half-deployed plugin state.** Never copy individual files over a live plugin
directory — deactivate, delete, then redeploy as a unit. A plugin with a mix of
old and new files produces failures that are very difficult to diagnose because
the failure mode depends on which files were updated. Always deploy atomically.

**Front page not showing the site shell.** After activation, confirm that the
WordPress front page is set to the Site Root page. Check:

```bash
wp option get show_on_front   # should be 'page'
wp option get page_on_front   # should match goqw_site_root_page_id
wp option get goqw_site_root_page_id
```

If `show_on_front` is `'posts'`, the front page is still "Your latest posts".
Fix it via Settings → Reading → set "A static page" to the page titled "Site"
(slug: `goqw-site-root`). This is a known limitation documented as OV-001-F2 in
`docs/technical-debt.md` — the plugin cannot always detect the Sample Page
automatically.

**Mismatched service IDs.** The `services-content.ts` file defines service IDs;
the `work-content.ts` file references them via `serviceId`. If they drift, the
content integration test fails. Run `pnpm test` after editing both files.

**`id` and `key` both required on wizard fields.** Both fields must be present
on every wizard field definition. They should be identical for new fields (e.g.,
`id: 'contact_name', key: 'contact_name'`). Providing only one of them causes
the schema validation to fail with a `z.strictObject` error.

**`help` not `helpText`.** The optional hint text property on a wizard field is
`help: string`. A misspelled key like `helpText` is caught by `z.strictObject`
validation with an "Unrecognized key(s)" error — not silently ignored.

**`quantityFieldId` must point at a `number`-type field.** The pricing engine
reads the answer to `quantityFieldId` as a JavaScript number. Pointing it at a
`radio`, `select`, or `text` field causes the engine to multiply by a string,
producing `NaN` in the price range. The cross-reference validator catches this
with a clear error message.

**`FALLBACK_VERTICAL_ID` not updated after removing fencing.** If you remove
fencing from the registry and leave `FALLBACK_VERTICAL_ID = 'fencing'`, the
runtime fallback resolution fails silently — the wizard will not mount on a
malformed request. Update the fallback ID whenever you change which verticals
are registered.

**`goqw_enabled_services` with unknown IDs.** Unknown IDs are silently filtered
out at runtime. If you set `goqw_enabled_services` to a vertical ID that is not
compiled into the registry, it is silently dropped. The wizard will either show
no services (if all IDs are unknown) or the ServiceSelector (if some IDs are
unknown and others are valid). Verify with `pnpm build-plugin` that your
vertical is in the bundle.

**Schema validation vs TypeScript type checking.** TypeScript (`pnpm typecheck`)
checks structural shape and types. The Zod schema validation (`pnpm test`) checks
additional constraints: `id` format regex, `options` coherence, cross-references
between pricing and wizard field IDs. Both must pass. Do not rely on typecheck
alone to confirm a config is valid.

---

## Reference: file map

| Variation point                                           | Where to edit                                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------- |
| Business name, tagline, contact, hero copy, footer        | `apps/wizard/src/site/content/site-content.ts`                       |
| Services listed on Home and Services pages                | `apps/wizard/src/site/content/services-content.ts`                   |
| Portfolio entries (Our Work page)                         | `apps/wizard/src/site/content/work-content.ts`                       |
| Which wizard verticals are registered in the bundle       | `apps/wizard/src/domain/registry/verticals.ts`                       |
| Per-vertical wizard steps, fields, and conditions         | `apps/wizard/src/domain/fixtures/<vertical>.config.ts`               |
| Per-vertical pricing rules (base rate, modifiers, extras) | Same file as wizard config (two exports per file)                    |
| The fallback vertical when none can be resolved           | `FALLBACK_VERTICAL_ID` in `verticals.ts`                             |
| Default wizard for this WordPress install                 | WP option `goqw_wizard_id`                                           |
| Which verticals are offered on this WordPress install     | WP option `goqw_enabled_services` (empty = all)                      |
| Primary brand color                                       | WP option `goqw_primary_color`                                       |
| Make.com webhook destination                              | WP option `goqw_webhook_url` (see `docs/make-com-integration.md`)    |
| Plugin deploy procedure                                   | `docs/onboarding.md` → "Deploying the plugin to a WordPress install" |
| Site structure, routing, ESLint boundary rules            | `docs/onboarding.md` → "Site structure (Step 5.0)"                   |
| Adding a new site page (not covered in this runbook)      | `docs/onboarding.md` → "Adding a new site page"                      |
| Architectural decisions and rationale                     | `docs/decisions/` — numbered ADRs                                    |
| Deferred work and trigger conditions                      | `docs/technical-debt.md`                                             |
| Medium-term product direction                             | `docs/product-vision.md`                                             |

---

_This runbook reflects the system as of Step 5.4 (June 2026). When later steps
add new capabilities (Step 5.6 visual customization, Step 6.0 production
deployment), this runbook will be amended in the same commit as those
additions._
