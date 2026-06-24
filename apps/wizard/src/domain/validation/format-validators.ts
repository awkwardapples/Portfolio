/**
 * Field-key → format validator map.
 *
 * Keyed by field.key (the answer map key). When validateField encounters a
 * non-empty string answer for a key listed here, it runs the format validator
 * in addition to the standard required/type checks.
 *
 * Applied by `answer-validation.ts` inside `validateField`. No changes to
 * field configs or FieldSchema are required (ADR-0022).
 *
 * Keys registered here are intentionally shared across wizards: the pre-step
 * and existing service contact steps use the same keys, so format validation
 * applies uniformly wherever these fields appear.
 */

import type { ValidationResult } from './address-validator';
import { validatePostcode } from './address-validator';
import { validateEmail } from './email-validator';
import { validatePhone } from './phone-validator';

export type FieldFormatValidator = (value: string) => ValidationResult;

export const FORMAT_VALIDATORS: ReadonlyMap<string, FieldFormatValidator> = new Map([
  ['postcode', validatePostcode],
  ['contact_email', validateEmail],
  ['contact_phone', validatePhone],
]);
