/**
 * Test doubles for the Worker (ADR-0043):
 *
 * - `sqliteD1()`: a D1Database over Node's built-in SQLite with the real
 *   migrations applied, so the repository's SQL runs against the schema it
 *   will meet in production;
 * - `memoryRepository()` and `memoryRateLimits()`: plain in-memory versions
 *   for the pipeline tests, which record every call;
 * - `submission()`: a valid portfolio payload to vary per test.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { RateLimitEntry, RateLimitStore } from '../src/security/rate-limit';
import type {
  NewSubmission,
  StoredSubmission,
  SubmissionRepository,
  SubmissionStatus,
} from '../src/submissions/repository';

// A string URL keeps the Workers and Node URL types apart.
const MIGRATIONS = fileURLToPath(new URL('../migrations/', import.meta.url).href);

// node:sqlite is loaded at run time: Vitest 2's bundler does not know it as a built-in.
interface SqliteStatement {
  run(...params: unknown[]): { lastInsertRowid: number | bigint; changes: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
}
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as {
  DatabaseSync: new (path: string) => SqliteDatabase;
};

type Param = string | number | null;

/** A minimal D1Database over node:sqlite: prepare, bind, run, first, all. */
export function sqliteD1(): D1Database {
  const db = new DatabaseSync(':memory:');
  for (const file of readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
  }
  const prepare = (sql: string) => {
    let params: Param[] = [];
    const statement = {
      bind(...values: unknown[]) {
        params = values.map((value) => (value === undefined ? null : (value as Param)));
        return statement;
      },
      async run() {
        const result = db.prepare(sql).run(...params);
        return {
          success: true,
          results: [],
          meta: { last_row_id: Number(result.lastInsertRowid), changes: Number(result.changes) },
        };
      },
      async first<T>() {
        return (db.prepare(sql).get(...params) as T | undefined) ?? null;
      },
      async all<T>() {
        return { success: true, results: db.prepare(sql).all(...params) as T[], meta: {} };
      },
    };
    return statement;
  };
  return { prepare } as unknown as D1Database;
}

export interface MemoryRow extends NewSubmission {
  id: number;
  forwardAttempts: number;
  lastError: string | null;
}

export function memoryRepository(
  options: { failInsert?: boolean; recentMatch?: number | null } = {},
) {
  const rows: MemoryRow[] = [];
  const calls: string[] = [];
  const contactQueries: { emailNorm: string; phoneNorm: string; windowStart: string }[] = [];
  const repository: SubmissionRepository = {
    async insert(submission) {
      calls.push('insert');
      if (options.failInsert) throw new Error('disk full');
      if (rows.some((row) => row.reference === submission.reference)) {
        throw new Error('UNIQUE constraint failed: submissions.reference');
      }
      const id = rows.length + 1;
      rows.push({ ...submission, id, forwardAttempts: 0, lastError: null });
      return id;
    },
    async findRecentByContact(emailNorm, phoneNorm, windowStart) {
      calls.push('findRecentByContact');
      contactQueries.push({ emailNorm, phoneNorm, windowStart });
      return options.recentMatch ?? null;
    },
    async markForwarded(id) {
      calls.push('markForwarded');
      const row = rows.find((candidate) => candidate.id === id)!;
      row.status = 'forwarded';
      row.forwardAttempts += 1;
      row.nextAttemptAt = null;
    },
    async recordForwardFailure(id, error, nextAttemptAt, finalStatus: SubmissionStatus) {
      calls.push('recordForwardFailure');
      const row = rows.find((candidate) => candidate.id === id)!;
      row.status = finalStatus;
      row.forwardAttempts += 1;
      row.nextAttemptAt = nextAttemptAt;
      row.lastError = error;
    },
    async listDue(now, limit) {
      calls.push('listDue');
      return rows
        .filter(
          (row) =>
            row.status === 'pending' && row.nextAttemptAt !== null && row.nextAttemptAt <= now,
        )
        .slice(0, limit)
        .map(
          (row): StoredSubmission => ({
            id: row.id,
            reference: row.reference,
            intent: row.intent,
            schemaVersion: row.schemaVersion,
            answersJson: row.answersJson,
            status: row.status,
            forwardAttempts: row.forwardAttempts,
            createdAt: row.createdAt,
            clientTimestamp: row.clientTimestamp,
          }),
        );
    },
    async lease(id, until) {
      calls.push('lease');
      rows.find((row) => row.id === id)!.nextAttemptAt = until;
    },
    async deleteOlderThan(cutoff) {
      calls.push('deleteOlderThan');
      const before = rows.length;
      for (let i = rows.length - 1; i >= 0; i -= 1)
        if (rows[i]!.createdAt < cutoff) rows.splice(i, 1);
      return before - rows.length;
    },
  };
  return { repository, rows, calls, contactQueries };
}

export function memoryRateLimits(): RateLimitStore & { entries: Map<string, RateLimitEntry> } {
  const entries = new Map<string, RateLimitEntry>();
  return {
    entries,
    async get(key) {
      return entries.get(key) ?? null;
    },
    async put(key, entry) {
      entries.set(key, { ...entry });
    },
  };
}

/** A valid "hiring" submission as the contact wizard sends it. */
export function submission(
  overrides: Record<string, unknown> = {},
  answers: Record<string, unknown> = {},
) {
  return {
    wizardId: 'hiring',
    schemaVersion: 1,
    contractVersion: 3,
    quoteMode: 'manual',
    answers: {
      work_type: 'ai-engineering',
      arrangement: 'full-time',
      contact_name: 'Jane Doe',
      contact_email: 'jane@example.com',
      message: 'We have a role you may like.',
      data_processing_consent: ['agreed'],
      ...answers,
    },
    pricing: null,
    clientTimestamp: '2026-10-04T12:00:00.000Z',
    honeypotValue: '',
    turnstileToken: null,
    ...overrides,
  };
}
