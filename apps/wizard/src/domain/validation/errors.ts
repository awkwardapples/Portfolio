/**
 * Validation error type + deterministic, plain-language formatting.
 *
 * Requirements (4.1):
 *   - Deterministic order, wording, and path formatting. The same malformed
 *     config produces byte-stable output between runs (issues are sorted by a
 *     stable key). This matters for CI readability and future snapshot tests.
 *   - Plain, operational language. No "Oops", "Something went wrong", "Looks
 *     like", "Let's fix", no emoji, no conversational filler, no
 *     anthropomorphism. A message states what is wrong and where.
 *   - No marketing language (shares the banned-word discipline with the lint
 *     rule; asserted in tests).
 */

import { z } from 'zod';

/**
 * A single validation problem. `path` is a stable dotted path into the config
 * (e.g. "steps.2.fields.0.label"); `message` is a plain-language description.
 */
export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

/**
 * The result of validating a config. Either ok with the typed value, or not ok
 * with a complete, ordered list of issues (never a partial result).
 */
export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

/**
 * Format a Zod path array into a stable dotted string.
 * Numeric indices are kept as-is: "steps.2.fields.0.label".
 */
export function formatPath(path: ReadonlyArray<string | number>): string {
  if (path.length === 0) return '(root)';
  return path.join('.');
}

/**
 * Convert a ZodError into a deterministic, ordered list of plain-language
 * issues. Sorting is by path then message so output is byte-stable regardless
 * of the order Zod happened to surface issues.
 */
export function issuesFromZodError(error: z.ZodError): ValidationIssue[] {
  const issues = error.issues.map((issue) => ({
    path: formatPath(issue.path),
    message: normaliseMessage(issue.message),
  }));

  issues.sort((a, b) => {
    if (a.path !== b.path) return a.path < b.path ? -1 : 1;
    return a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
  });

  return issues;
}

/**
 * Ensure a message is operational and plain. Custom schema messages are
 * already written to this standard; this is a safety net that trims and
 * guarantees a terminal period for byte-stability. It does NOT inject tone.
 */
function normaliseMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed === '') return 'Invalid value.';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/**
 * Build a single human-readable report string from issues. Deterministic:
 * one issue per line, "path: message", in sorted order. Suitable for CI logs.
 */
export function formatReport(issues: readonly ValidationIssue[]): string {
  if (issues.length === 0) return 'No validation issues.';
  return issues.map((i) => `${i.path}: ${i.message}`).join('\n');
}
