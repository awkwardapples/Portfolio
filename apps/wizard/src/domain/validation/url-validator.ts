/**
 * Web address format validator (portfolio Pass 6): an absolute http or https
 * URL with a host that has a dot in it. Format-level only; nothing is fetched.
 *
 * Per ADR-0022: keyed by answer key in format-validators.ts.
 */

import type { ValidationResult } from './address-validator';

export function validateUrl(input: string): ValidationResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, errorMessage: 'Please enter a web address.' };
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { valid: false, errorMessage: 'Please enter a full web address, starting https://' };
  }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || !url.hostname.includes('.')) {
    return { valid: false, errorMessage: 'Please enter a full web address, starting https://' };
  }
  return { valid: true };
}
