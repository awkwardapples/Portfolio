# ADR-0015: Submission Pipeline Architecture

**Status:** Accepted
**Date:** 2026-05-30

## Context

Step 4.6 closes the wizard's end-to-end submission loop. Until 4.6 the
frontend dispatched submissions to `devSubmissionPort`, which never contacted
a backend. The real backend pipeline has three actors with strict ordering
requirements:

- **Browser (React + FSM)** — submits and reconciles the result.
- **WordPress REST endpoint (`qw/v1/submit`)** — persists durably and forwards.
- **Make.com** — receives the lead via webhook.

ADR-0001 mandates: persist before forward.  
ADR-0005 mandates: forward synchronously; a forward failure returns HTTP 502.  
ADR-0015 documents how both are implemented together and defines the wire
contract between all three actors.

## Decision

### Wire contract (browser ↔ REST)

**Request** — `POST /wp-json/qw/v1/submit`  
`Content-Type: application/json`, `X-WP-Nonce: <wp_rest nonce>`

```json
{
  "wizardId": "string",
  "schemaVersion": 1,
  "contractVersion": 2,
  "answers": {},
  "pricing": { "totalPence": 0, "lowPence": 0, "highPence": 0, "currency": "GBP" },
  "clientTimestamp": "ISO-8601"
}
```

`pricing` is optional (null when the pricing gate was not satisfied).  
`contractVersion` must be `2` (ADR-0009 amendment); mismatches return 400.

**Response shape**

| Status  | Body                                                             | Meaning                          |
| ------- | ---------------------------------------------------------------- | -------------------------------- |
| 200     | `{ "reference": "GOQW-<id>" }`                                   | Persisted and forwarded.         |
| 400     | `{ "errorCode": "validation_failed" }`                           | Payload invalid; nothing stored. |
| 401/403 | `{ "errorCode": "unauthorized" }`                                | Nonce missing/expired.           |
| 500     | `{ "errorCode": "persistence_failed" }`                          | DB error; nothing forwarded.     |
| 502     | `{ "errorCode": "forwarder_unavailable", "submissionId": <id> }` | Persisted; forward failed.       |

### Server-side ordering (strict, ADR-0001 + ADR-0005)

1. Validate nonce + payload. On failure → 400, nothing persisted.
2. `INSERT INTO wp_goqw_submissions` (`status='persisted'`).  
   On failure → 500, NO forward attempted.
3. Forward to Make.com webhook synchronously (`wp_remote_post`, 10 s timeout).
4. Respond:
   - Success → `UPDATE status='forwarded'` → 200 `{ reference }`.
   - Failure → `UPDATE status='forward_failed'` + `[goqw-ops]` log → 502.

### Browser reconciliation

`httpSubmissionPort` maps every HTTP status and network failure to a
`SubmissionPortResult`; no exception crosses the port boundary. The FSM
dispatches `SUBMIT_SUCCEEDED` (200) or `SUBMIT_FAILED` (all other outcomes).

The 502 response triggers `SUBMIT_FAILED` with error code
`'forwarder_unavailable'` and the message _"Your submission was saved. We
could not notify our team automatically. Please try again or call us
directly."_ — truthful to the user (data is safe) and compliant with
ADR-0012 (plain language, no apology, no marketing copy).

### Retry policy

Retry is user-initiated via the FSM event `SUBMIT_RETRY`. The port never
retries internally; silent retry risks creating duplicate rows on transient
errors. The user controls when a duplicate POST is acceptable.

### `wp_goqw_submissions` schema additions

Step 4.6 redesigns the submissions table (existing Phase-3 schema was
placeholder). New columns relevant to the pipeline:

| Column                 | Type          | Purpose                                       |
| ---------------------- | ------------- | --------------------------------------------- |
| `wizard_id`            | VARCHAR(191)  | Selects the vertical (matches registry key)   |
| `schema_version`       | INT           | For future migration support                  |
| `answers_json`         | LONGTEXT      | Full answer map from the React wizard         |
| `pricing_json`         | LONGTEXT NULL | Pricing snapshot at submit time               |
| `client_timestamp`     | VARCHAR(64)   | Browser-side ISO-8601 timestamp               |
| `status`               | VARCHAR(32)   | `persisted` → `forwarded` \| `forward_failed` |
| `forward_attempted_at` | DATETIME NULL | When forward was last tried                   |

## Alternatives considered

**Asynchronous forwarding (queue + cron).** Rejected: ADR-0005 mandates
synchronous behaviour. Async forwarding hides failures from the user.

**Silent retry inside the port.** Rejected: creates duplicate persisted rows
and hides the retry from the user.

**Separate persistence-failure and forward-failure at the browser.** Rejected:
both map to `SUBMIT_FAILED` + retry; the distinction belongs in server logs and
admin tooling, not in the UI.

## Future work (not in scope)

- **Idempotency key**: a hash of `(clientTimestamp + wizardId + answers)` could
  prevent duplicate rows on user retry. Deferred; the current volume makes
  accidental duplicates recoverable via Make.com workflow de-duplication.
- **Rate limiting**: the public endpoint is protected only by the WP REST nonce.
  A per-IP throttle should be added before high-traffic deployments.
- **Admin replay UI**: rows with `status='forward_failed'` are recoverable.
  A Phase 6 admin screen could list them and trigger a re-forward without
  browser involvement.

## Consequences

**Easier:**

- Submissions are never silently lost; every failure is surfaced to the user
  and recorded in the database.
- The 502 semantics are honest: the data is safe, only the downstream notify
  failed.

**Harder:**

- The table redesign requires a fresh activation on existing dev installs
  (deactivate, drop `wp_goqw_submissions`, reactivate). No migration path for
  production because there is no production yet.
