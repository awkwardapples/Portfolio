/**
 * The closed vertical registry.
 *
 * Adding a new vertical = adding an entry here + a config module under
 * src/domain/fixtures/. There is no dynamic registration mechanism; the
 * registry is curated in-repo so every vertical is type-checked and tested
 * against the 4.1 schemas at build time.
 *
 * Step 5.9: 9 new services added (painting, patio, driveway, steps, jetwash,
 * general-repairs, plumbing, electrical, carpentry). All 11 services carry
 * a categoryId assignment per ADR-0021 Decision 4.
 *
 * Step 6.3: 'other' added as a 12th, deliberately uncategorized (no
 * categoryId) long-tail catch-all — see ADR-0035.
 */

import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { deckingWizardConfig, deckingPricingConfig } from '@/domain/fixtures/decking.config';
import { paintingWizardConfig, paintingPricingConfig } from '@/domain/fixtures/painting.config';
import { patioWizardConfig, patioPricingConfig } from '@/domain/fixtures/patio.config';
import { drivewayWizardConfig, drivewayPricingConfig } from '@/domain/fixtures/driveway.config';
import { stepsWizardConfig, stepsPricingConfig } from '@/domain/fixtures/steps.config';
import { jetwashWizardConfig, jetwashPricingConfig } from '@/domain/fixtures/jetwash.config';
import {
  generalRepairsWizardConfig,
  generalRepairsPricingConfig,
} from '@/domain/fixtures/general-repairs.config';
import { plumbingWizardConfig, plumbingPricingConfig } from '@/domain/fixtures/plumbing.config';
import {
  electricalWizardConfig,
  electricalPricingConfig,
} from '@/domain/fixtures/electrical.config';
import { carpentryWizardConfig, carpentryPricingConfig } from '@/domain/fixtures/carpentry.config';
import { otherWizardConfig, otherPricingConfig } from '@/domain/fixtures/other.config';
import type { Vertical } from '@/domain/registry/types';

// ---------------------------------------------------------------------------
// Landscaping
// ---------------------------------------------------------------------------

const fencing: Vertical = {
  id: 'fencing',
  label: 'Fencing',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: fencingWizardConfig,
  pricing: fencingPricingConfig,
};

const decking: Vertical = {
  id: 'decking',
  label: 'Decking',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: deckingWizardConfig,
  pricing: deckingPricingConfig,
};

const patio: Vertical = {
  id: 'patio',
  label: 'Patio & Paving',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: patioWizardConfig,
  pricing: patioPricingConfig,
};

const driveway: Vertical = {
  id: 'driveway',
  label: 'Driveway',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: drivewayWizardConfig,
  pricing: drivewayPricingConfig,
};

const steps: Vertical = {
  id: 'steps',
  label: 'Garden Steps',
  schemaVersion: 1,
  categoryId: 'landscaping',
  wizard: stepsWizardConfig,
  pricing: stepsPricingConfig,
};

// ---------------------------------------------------------------------------
// Decorating
// ---------------------------------------------------------------------------

const painting: Vertical = {
  id: 'painting',
  label: 'Painting & Decorating',
  schemaVersion: 1,
  categoryId: 'decorating',
  wizard: paintingWizardConfig,
  pricing: paintingPricingConfig,
};

// ---------------------------------------------------------------------------
// Exterior Cleaning
// ---------------------------------------------------------------------------

const jetwash: Vertical = {
  id: 'jetwash',
  label: 'Pressure Washing',
  schemaVersion: 1,
  categoryId: 'exterior-cleaning',
  wizard: jetwashWizardConfig,
  pricing: jetwashPricingConfig,
};

// ---------------------------------------------------------------------------
// Handyman Services
// ---------------------------------------------------------------------------

const generalRepairs: Vertical = {
  id: 'general-repairs',
  label: 'General Repairs',
  schemaVersion: 1,
  categoryId: 'handyman',
  wizard: generalRepairsWizardConfig,
  pricing: generalRepairsPricingConfig,
};

const plumbing: Vertical = {
  id: 'plumbing',
  label: 'Plumbing',
  schemaVersion: 1,
  categoryId: 'handyman',
  wizard: plumbingWizardConfig,
  pricing: plumbingPricingConfig,
};

const electrical: Vertical = {
  id: 'electrical',
  label: 'Electrical',
  schemaVersion: 1,
  categoryId: 'handyman',
  wizard: electricalWizardConfig,
  pricing: electricalPricingConfig,
};

const carpentry: Vertical = {
  id: 'carpentry',
  label: 'Carpentry',
  schemaVersion: 1,
  categoryId: 'handyman',
  wizard: carpentryWizardConfig,
  pricing: carpentryPricingConfig,
};

// ---------------------------------------------------------------------------
// Other (Step 6.3) — long-tail catch-all, deliberately uncategorized so it
// isn't hidden by category-navigation filtering under any of the four
// existing categories; see AUDIT-6.3-service-structure.md.
// ---------------------------------------------------------------------------

const other: Vertical = {
  id: 'other',
  label: 'Other services',
  schemaVersion: 1,
  wizard: otherWizardConfig,
  pricing: otherPricingConfig,
};

/**
 * The closed registry. Object.freeze provides runtime defence against mutation.
 *
 * Key insertion order is the default display/selection order
 * (domain/registry/services.ts's listEnabledServiceIds() derives it from
 * Object.keys(VERTICALS)) — 'other' is deliberately the last key so it
 * appears last in the service list by default (ADR-0035 D1).
 */
export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  decking,
  painting,
  patio,
  driveway,
  steps,
  jetwash,
  'general-repairs': generalRepairs,
  plumbing,
  electrical,
  carpentry,
  other,
});

/**
 * The fallback target when PublicConfig.wizardId is unknown or unresolvable.
 * Bumping this is a deliberate decision documented in ADR-0013.
 */
export const FALLBACK_VERTICAL_ID = 'fencing' as const;
