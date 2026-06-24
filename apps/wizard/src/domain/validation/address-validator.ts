/**
 * UK postcode format validator.
 *
 * Validates format per the gov.uk postcode standard. Does not check existence
 * (no external API call). Accepts with or without space, upper or lowercase.
 *
 * Per ADR-0022 (wizard pre-step mechanism).
 */

export interface ValidationResult {
  readonly valid: boolean;
  readonly errorMessage?: string;
}

// Covers standard UK postcodes and GIR 0AA (Royal Mail special case).
const UK_POSTCODE_RE =
  /^(GIR ?0AA|([A-Za-z][0-9]{1,2}|[A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2}|[A-Za-z][0-9][A-Za-z]|[A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z]) ?[0-9][A-Za-z]{2})$/;

export function validatePostcode(input: string): ValidationResult {
  const trimmed = input.trim().toUpperCase();
  if (!trimmed) return { valid: false, errorMessage: 'Please enter a postcode.' };
  if (!UK_POSTCODE_RE.test(trimmed))
    return { valid: false, errorMessage: 'Please enter a valid UK postcode (e.g. SW1A 1AA).' };
  return { valid: true };
}
