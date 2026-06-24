/**
 * UK phone number format validator.
 *
 * Accepts common UK formats:
 *   01234 567890   (landline with space)
 *   01234567890    (landline, no space)
 *   07712 345678   (mobile with space)
 *   07712345678    (mobile, no space)
 *   +44 7712 345678  (international)
 *   +441234567890    (international, no spaces)
 *
 * Digits only (after stripping spaces and converting +44 → 0) must be
 * 10 or 11 digits. Blocks obviously wrong entries like '12345'.
 *
 * Per ADR-0022.
 */

import type { ValidationResult } from './address-validator';

export function validatePhone(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, errorMessage: 'Please enter a phone number.' };

  // Normalise: strip spaces, convert international prefix to leading zero
  const digits = trimmed
    .replace(/\s+/g, '')
    .replace(/^\+44/, '0')
    .replace(/[^0-9]/g, '');

  if (digits.length < 10 || digits.length > 11) {
    return {
      valid: false,
      errorMessage: 'Please enter a valid UK phone number (e.g. 07712 345678 or 01234 567890).',
    };
  }

  return { valid: true };
}
