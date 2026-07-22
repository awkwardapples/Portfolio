import { describe, it, expect } from 'vitest';

import { asFieldStep } from './_helpers';
import { fencingWizardConfig } from '@/domain/fixtures/fencing.config';
import { deckingWizardConfig } from '@/domain/fixtures/decking.config';
import { paintingWizardConfig } from '@/domain/fixtures/painting.config';
import { patioWizardConfig } from '@/domain/fixtures/patio.config';
import { drivewayWizardConfig } from '@/domain/fixtures/driveway.config';
import { stepsWizardConfig } from '@/domain/fixtures/steps.config';
import { jetwashWizardConfig } from '@/domain/fixtures/jetwash.config';
import { generalRepairsWizardConfig } from '@/domain/fixtures/general-repairs.config';
import { plumbingWizardConfig } from '@/domain/fixtures/plumbing.config';
import { electricalWizardConfig } from '@/domain/fixtures/electrical.config';
import { carpentryWizardConfig } from '@/domain/fixtures/carpentry.config';
import { otherWizardConfig } from '@/domain/fixtures/other.config';

/**
 * Consent must sit on the last *mandatory* step of every wizard config (Step
 * 5.14, AUDIT-5.14-consent-integration.md) — never on 'optional-details',
 * which is deliberately skippable. Instant-quote services' mandatory tail is
 * 'contact-and-address'; manual-quote services' mandatory tail is 'address'.
 */
const INSTANT_CONFIGS = [
  { id: 'fencing', config: fencingWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'decking', config: deckingWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'painting', config: paintingWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'patio', config: patioWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'driveway', config: drivewayWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'steps', config: stepsWizardConfig, lastMandatoryStepId: 'contact-and-address' },
  { id: 'jetwash', config: jetwashWizardConfig, lastMandatoryStepId: 'contact-and-address' },
];

const MANUAL_CONFIGS = [
  { id: 'general-repairs', config: generalRepairsWizardConfig, lastMandatoryStepId: 'address' },
  { id: 'plumbing', config: plumbingWizardConfig, lastMandatoryStepId: 'address' },
  { id: 'electrical', config: electricalWizardConfig, lastMandatoryStepId: 'address' },
  { id: 'carpentry', config: carpentryWizardConfig, lastMandatoryStepId: 'address' },
  { id: 'other', config: otherWizardConfig, lastMandatoryStepId: 'address' },
];

const ALL_CONFIGS = [...INSTANT_CONFIGS, ...MANUAL_CONFIGS];

describe('data_processing_consent field — present on every wizard (Step 5.14)', () => {
  it.each(ALL_CONFIGS)(
    '$id has a required checkbox consent field on its last mandatory step',
    ({ config, lastMandatoryStepId }) => {
      const step = asFieldStep(config.steps.find((s) => s.id === lastMandatoryStepId));
      const field = step.fields.find((f) => f.key === 'data_processing_consent');

      expect(field).toBeDefined();
      expect(field!.type).toBe('checkbox');
      expect(field!.required).toBe(true);
      expect(field!.options).toEqual([{ value: 'agreed', label: expect.any(String) }]);
    },
  );

  it.each(ALL_CONFIGS)(
    '$id consent field is the last field on that step',
    ({ config, lastMandatoryStepId }) => {
      const step = asFieldStep(config.steps.find((s) => s.id === lastMandatoryStepId));
      expect(step.fields[step.fields.length - 1]?.key).toBe('data_processing_consent');
    },
  );
});

describe('data_processing_consent field — never on the skippable optional-details step (regression)', () => {
  it.each(INSTANT_CONFIGS)('$id optional-details step does not collect consent', ({ config }) => {
    const step = asFieldStep(config.steps.find((s) => s.id === 'optional-details'));
    expect(step.fields.some((f) => f.key === 'data_processing_consent')).toBe(false);
  });
});
