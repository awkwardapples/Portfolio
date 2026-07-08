import { isFieldStep, type AnyStep, type Step } from '@/domain/config/wizard-config';

/** Narrow an AnyStep to Step, throwing if undefined or not a field step. */
export function asFieldStep(step: AnyStep | undefined): Step {
  if (!step) throw new Error('step not found');
  if (!isFieldStep(step)) throw new Error('expected field step');
  return step;
}
