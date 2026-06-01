/**
 * The closed vertical registry.
 *
 * Adding a new vertical = adding an entry here + a config module under
 * src/domain/fixtures/. There is no dynamic registration mechanism; the
 * registry is curated in-repo so every vertical is type-checked and tested
 * against the 4.1 schemas at build time.
 */

import { fencingWizardConfig, fencingPricingConfig } from '@/domain/fixtures/fencing.config';
import { deckingWizardConfig, deckingPricingConfig } from '@/domain/fixtures/decking.config';
import type { Vertical } from '@/domain/registry/types';

const fencing: Vertical = {
  id: 'fencing',
  label: 'Fencing (reference template)',
  schemaVersion: 1,
  wizard: fencingWizardConfig,
  pricing: fencingPricingConfig,
};

const decking: Vertical = {
  id: 'decking',
  label: 'Decking (reference template)',
  schemaVersion: 1,
  wizard: deckingWizardConfig,
  pricing: deckingPricingConfig,
};

/**
 * The closed registry. Object.freeze provides runtime defence against mutation.
 */
export const VERTICALS: Readonly<Record<string, Vertical>> = Object.freeze({
  fencing,
  decking,
});

/**
 * The fallback target when PublicConfig.wizardId is unknown or unresolvable.
 * Bumping this is a deliberate decision documented in ADR-0013.
 */
export const FALLBACK_VERTICAL_ID = 'fencing' as const;
