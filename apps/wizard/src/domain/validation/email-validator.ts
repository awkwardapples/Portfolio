/**
 * Email format validator.
 *
 * Validates standard email format. Does not check MX records or deliverability;
 * format-level only.
 *
 * Per ADR-0022.
 */

import type { ValidationResult } from './address-validator';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, errorMessage: 'Please enter an email address.' };
  if (!EMAIL_RE.test(trimmed))
    return { valid: false, errorMessage: 'Please enter a valid email address.' };
  return { valid: true };
}
