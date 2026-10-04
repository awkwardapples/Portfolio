/**
 * Storage for submissions and rate-limit counters (spec Q.3), behind small
 * interfaces so the pipeline is tested against an in-memory version and the
 * D1 version is tested against the real migration (test/d1.test.ts).
 *
 * Every statement is parameterised. Times are ISO 8601 strings in UTC, which
 * compare correctly as text; rate-limit expiry is Unix seconds.
 */
import type { RateLimitEntry, RateLimitStore } from '../security/rate-limit';

export type SubmissionStatus =
  | 'pending'
  | 'forwarded'
  | 'forward_failed'
  | 'duplicate_not_forwarded';

export interface NewSubmission {
  reference: string;
  intent: string;
  schemaVersion: number;
  answersJson: string;
  contactEmailNorm: string | null;
  isDuplicate: boolean;
  duplicateOf: number | null;
  consentTimestamp: string;
  status: SubmissionStatus;
  /** When the cron may first try to forward it (a lease while the immediate forward runs). */
  nextAttemptAt: string | null;
  clientTimestamp: string;
  createdAt: string;
}

export interface StoredSubmission {
  id: number;
  reference: string;
  intent: string;
  schemaVersion: number;
  answersJson: string;
  status: SubmissionStatus;
  forwardAttempts: number;
  createdAt: string;
  clientTimestamp: string;
}

export interface SubmissionRepository {
  /** Inserts the row and returns its id. Throws if the reference is taken. */
  insert(submission: NewSubmission): Promise<number>;
  /** The id of a non-duplicate submission from this email since windowStart, or null. */
  findRecentByContact(
    emailNorm: string,
    phoneNorm: string,
    windowStart: string,
  ): Promise<number | null>;
  markForwarded(id: number): Promise<void>;
  /** Records a failed attempt: the next try at nextAttemptAt, or none when it gives up. */
  recordForwardFailure(
    id: number,
    error: string,
    nextAttemptAt: string | null,
    finalStatus: SubmissionStatus,
  ): Promise<void>;
  /** Pending rows due for another attempt, oldest first. */
  listDue(now: string, limit: number): Promise<StoredSubmission[]>;
  /** Pushes a row's next attempt into the future so two forwarders never overlap. */
  lease(id: number, until: string): Promise<void>;
  deleteOlderThan(cutoff: string): Promise<number>;
}

interface Row {
  id: number;
  reference: string;
  intent: string;
  schema_version: number;
  answers_json: string;
  status: SubmissionStatus;
  forward_attempts: number;
  client_timestamp: string | null;
  created_at: string;
}

export class D1SubmissionRepository implements SubmissionRepository {
  constructor(private readonly db: D1Database) {}

  async insert(s: NewSubmission): Promise<number> {
    const result = await this.db
      .prepare(
        `INSERT INTO submissions (reference, intent, schema_version, answers_json, contact_email_norm,
           is_duplicate, duplicate_of, consent_given, consent_timestamp, status, next_attempt_at,
           client_timestamp, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
      )
      .bind(
        s.reference,
        s.intent,
        s.schemaVersion,
        s.answersJson,
        s.contactEmailNorm,
        s.isDuplicate ? 1 : 0,
        s.duplicateOf,
        s.consentTimestamp,
        s.status,
        s.nextAttemptAt,
        s.clientTimestamp,
        s.createdAt,
      )
      .run();
    return Number(result.meta.last_row_id);
  }

  async findRecentByContact(emailNorm: string, _phoneNorm: string, windowStart: string) {
    // No phone field exists on the portfolio's forms; the email is the match (spec Q.2).
    if (emailNorm === '') return null;
    const row = await this.db
      .prepare(
        `SELECT id FROM submissions
          WHERE contact_email_norm = ? AND is_duplicate = 0 AND created_at >= ?
          ORDER BY created_at DESC LIMIT 1`,
      )
      .bind(emailNorm, windowStart)
      .first<{ id: number }>();
    return row ? row.id : null;
  }

  async markForwarded(id: number) {
    await this.db
      .prepare(
        `UPDATE submissions SET status = 'forwarded', forward_attempts = forward_attempts + 1,
           next_attempt_at = NULL, last_error = NULL WHERE id = ?`,
      )
      .bind(id)
      .run();
  }

  async recordForwardFailure(
    id: number,
    error: string,
    nextAttemptAt: string | null,
    finalStatus: SubmissionStatus,
  ) {
    await this.db
      .prepare(
        `UPDATE submissions SET status = ?, forward_attempts = forward_attempts + 1,
           next_attempt_at = ?, last_error = ? WHERE id = ?`,
      )
      .bind(finalStatus, nextAttemptAt, error.slice(0, 500), id)
      .run();
  }

  async listDue(now: string, limit: number) {
    const { results } = await this.db
      .prepare(
        `SELECT id, reference, intent, schema_version, answers_json, status, forward_attempts,
                client_timestamp, created_at
           FROM submissions
          WHERE status = 'pending' AND next_attempt_at IS NOT NULL AND next_attempt_at <= ?
          ORDER BY next_attempt_at LIMIT ?`,
      )
      .bind(now, limit)
      .all<Row>();
    return results.map((row) => ({
      id: row.id,
      reference: row.reference,
      intent: row.intent,
      schemaVersion: row.schema_version,
      answersJson: row.answers_json,
      status: row.status,
      forwardAttempts: row.forward_attempts,
      clientTimestamp: row.client_timestamp ?? '',
      createdAt: row.created_at,
    }));
  }

  async lease(id: number, until: string) {
    await this.db
      .prepare(`UPDATE submissions SET next_attempt_at = ? WHERE id = ?`)
      .bind(until, id)
      .run();
  }

  async deleteOlderThan(cutoff: string) {
    const result = await this.db
      .prepare(`DELETE FROM submissions WHERE created_at < ?`)
      .bind(cutoff)
      .run();
    return Number(result.meta.changes ?? 0);
  }
}

export class D1RateLimitStore implements RateLimitStore {
  constructor(private readonly db: D1Database) {}

  async get(key: string): Promise<RateLimitEntry | null> {
    const row = await this.db
      .prepare(`SELECT count, expires_at FROM rate_limits WHERE key = ?`)
      .bind(key)
      .first<{ count: number; expires_at: number }>();
    return row ? { count: row.count, expiresAt: row.expires_at } : null;
  }

  async put(key: string, entry: RateLimitEntry): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, ?, ?)
         ON CONFLICT (key) DO UPDATE SET count = excluded.count, expires_at = excluded.expires_at`,
      )
      .bind(key, entry.count, entry.expiresAt)
      .run();
  }

  /** Removes windows that have ended (the daily cron). */
  async deleteExpired(nowSeconds: number): Promise<number> {
    const result = await this.db
      .prepare(`DELETE FROM rate_limits WHERE expires_at <= ?`)
      .bind(nowSeconds)
      .run();
    return Number(result.meta.changes ?? 0);
  }
}
