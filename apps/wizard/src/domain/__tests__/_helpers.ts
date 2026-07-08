import { type Step } from '@/domain/config/wizard-config';

/** Cast a cloned AnyStep to Step for mutation-based tests that use field-step-only fixtures. */
export function asStep(step: unknown): Step {
  return step as Step;
}
