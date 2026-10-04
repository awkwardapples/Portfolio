/**
 * The Worker's cron jobs (spec Q.2; wrangler.jsonc `triggers`):
 *
 * - every 15 minutes, retry forwards still pending, oldest first, each
 *   leased first so an overlapping run never sends one twice;
 * - daily, delete submissions older than RETENTION_DAYS (90) and rate-limit
 *   windows that have ended.
 */
import { nextAttemptAfter, type ForwardInput, type ForwardResult } from './submissions/forwarder';
import type { SubmissionRepository } from './submissions/repository';

export const RETRY_CRON = '*/15 * * * *';
export const PRUNE_CRON = '17 3 * * *';
const BATCH = 20;
const LEASE_MS = 10 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

export async function retryPendingForwards(deps: {
  repository: SubmissionRepository;
  forward: (input: ForwardInput) => Promise<ForwardResult>;
  now?: () => number;
}): Promise<{ forwarded: number; failed: number }> {
  const now = deps.now ?? Date.now;
  const due = await deps.repository.listDue(new Date(now()).toISOString(), BATCH);
  let forwarded = 0;
  let failed = 0;
  for (const row of due) {
    await deps.repository.lease(row.id, new Date(now() + LEASE_MS).toISOString());
    let answers: Record<string, unknown>;
    try {
      answers = JSON.parse(row.answersJson) as Record<string, unknown>;
    } catch {
      await deps.repository.recordForwardFailure(
        row.id,
        'stored answers unreadable',
        null,
        'forward_failed',
      );
      failed += 1;
      continue;
    }
    const result = await deps.forward({
      id: row.id,
      reference: row.reference,
      intent: row.intent,
      schemaVersion: row.schemaVersion,
      answers,
      clientTimestamp: row.clientTimestamp,
    });
    if (result.ok) {
      await deps.repository.markForwarded(row.id);
      forwarded += 1;
    } else {
      const next = nextAttemptAfter(row.forwardAttempts + 1, now());
      await deps.repository.recordForwardFailure(
        row.id,
        result.error,
        next,
        next ? 'pending' : 'forward_failed',
      );
      failed += 1;
    }
  }
  return { forwarded, failed };
}

export async function pruneExpired(deps: {
  repository: Pick<SubmissionRepository, 'deleteOlderThan'>;
  deleteExpiredRateLimits: (nowSeconds: number) => Promise<number>;
  retentionDays: number;
  now?: () => number;
}): Promise<{ submissions: number; rateLimits: number }> {
  const now = (deps.now ?? Date.now)();
  const cutoff = new Date(now - deps.retentionDays * DAY_MS).toISOString();
  return {
    submissions: await deps.repository.deleteOlderThan(cutoff),
    rateLimits: await deps.deleteExpiredRateLimits(Math.floor(now / 1000)),
  };
}
