/**
 * Duplicate detection (spec Q.2; ported from the plugin's DuplicateDetector,
 * ADR-0028): a submission is a duplicate when a non-duplicate one from the
 * same normalised email (trimmed, lower-cased) or phone (digits only)
 * arrived in the last 24 hours (UTC). Duplicates are stored and flagged but
 * never forwarded.
 */
import type { SubmissionRepository } from './repository';

export const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export type DuplicateCheck =
  | { isDuplicate: false }
  | { isDuplicate: true; originalSubmissionId: number };

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalisePhone(phone: string): string {
  return phone.replace(/\D+/g, '');
}

export async function checkDuplicate(
  repository: Pick<SubmissionRepository, 'findRecentByContact'>,
  email: string,
  phone: string,
  now: number = Date.now(),
): Promise<DuplicateCheck> {
  const emailNorm = normaliseEmail(email);
  const phoneNorm = normalisePhone(phone);
  if (emailNorm === '' && phoneNorm === '') return { isDuplicate: false };
  const windowStart = new Date(now - DUPLICATE_WINDOW_MS).toISOString();
  const match = await repository.findRecentByContact(emailNorm, phoneNorm, windowStart);
  return match === null
    ? { isDuplicate: false }
    : { isDuplicate: true, originalSubmissionId: match };
}
