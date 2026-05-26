/**
 * PublicConfig validation — isolated entry point.
 *
 * Kept separate from validate.ts so the browser BOOT path (config-loader.ts)
 * imports only the PublicConfig schema + Zod, NOT the wizard/pricing schemas
 * (which aren't needed until the wizard renders in 4.4+). This keeps the
 * initial bundle lean: boot pays for PublicConfig validation only.
 *
 * Structural-only (no cross-references). Non-strict on unknown keys so the PHP
 * side can add forward-compatible fields the browser simply ignores.
 */

import { PublicConfigSchema, type PublicConfig } from '@/domain/config/public-config';
import { type ValidationResult, issuesFromZodError } from '@/domain/validation/errors';

export function validatePublicConfig(input: unknown): ValidationResult<PublicConfig> {
  const parsed = PublicConfigSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, issues: issuesFromZodError(parsed.error) };
  }
  return { ok: true, value: parsed.data };
}
