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

## Amendment — 2026-06-03: photo upload pipeline (Step 4.8)

### Media data shape (inside `answers[fieldKey]`)

Photo field answers are stored inside the existing `answers` object, not in a
separate top-level field. The value for a photo field key is:

```json
{
  "files": [
    {
      "fileId": "uuid-string",
      "originalName": "fence.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 312400,
      "width": 1600,
      "height": 1200,
      "dataBase64": "<base64-encoded JPEG bytes>"
    }
  ]
}
```

`fileId` is a client-generated UUID stable within a session. `dataBase64` is
the re-encoded (canvas-compressed) JPEG payload. The browser enforces:

- max 5 photos per field (configurable via `maxCount` on the field config)
- max 5 MB encoded per photo
- max 10 MB total encoded (client-side safety margin: rejects at 9 MB)
- accepted MIME types: `image/jpeg`, `image/png`, `image/webp`

### `mediaIssues` on 400 responses

When the server rejects a submission due to media validation failure, the 400
response body carries an optional `mediaIssues` array:

```json
{
  "errorCode": "media_validation_failed",
  "mediaIssues": [{ "fileIndex": 2, "code": "too_large" }]
}
```

Possible `code` values: `too_large`, `total_too_large`, `unsupported_type`,
`invalid_encoding`, `content_mismatch`, `not_an_image`, `dimensions_too_large`.

The `httpSubmissionPort` extracts `mediaIssues` from 400 responses and
surfaces them in the typed `SubmissionErrorInfo` so the UI can identify
which photo caused the rejection.

### Server-side media validation order (short-circuit)

Media checks run after existing payload-shape validation and before `INSERT`:

1. Per-photo encoded size ≤ 5 MB (cheapest check)
2. Running total encoded size ≤ 10 MB
3. MIME claim is in the allowlist (`image/jpeg | image/png | image/webp`)
4. Base64 decode succeeds
5. `finfo` magic-byte check matches the claimed MIME
6. `getimagesizefromstring()` confirms valid image dimensions ≤ 12 000 × 12 000 px

Short-circuit on first failure: the `fileIndex` of the failing file is
returned in `mediaIssues`. This prevents the server from decoding large
payloads unnecessarily.

### Magic-byte verification rationale

The `mimeType` field in the client payload is untrusted. A file renamed from
`malicious.svg` to `photo.jpg` would pass MIME-allowlist checks but reveal
its true type via `finfo`. Skipping magic-byte verification is a content-type
spoofing vulnerability; it is therefore mandatory for the media validation path
even though it is the most CPU-intensive check.

### Wire contract stability

This amendment is **additive**. `contractVersion` remains `2`. Existing
client/server pairs without photo fields continue to function; the media
extraction logic on the server is a no-op when `answers` contains no
`files` arrays.

### Backend storage

Photos are stored in a dedicated `media_json LONGTEXT NULL` column on
`wp_goqw_submissions`, separate from `answers_json`. This prevents inflating
routine row reads (which do not need the media bytes) with up to 10 MB of
base64. The Forwarder reads `media_json` alongside `answers_json` and
includes the decoded media array in the Make.com payload.

**Deployment prerequisite**: the Make.com workflow must be updated to handle
the new `media` array in the forwarded payload. The repo ships the contract;
configuring the downstream workflow is operational work.

### Photo sessionStorage behaviour

The browser FSM state holds `PhotoMetadata` (name, size, dimensions, fileId)
only — no base64. Base64 lives in a per-session volatile `PhotoStore` (a
`useRef<Map>` inside `WizardProvider`). sessionStorage persists metadata but
not bytes; if the user reloads the tab, photos must be re-attached. The review
screen shows a "re-attach required" indicator for metadata entries whose base64
is absent from the store.

---

## Amendment — 2026-06-01: wizardId equivalence (Step 4.7)

The `wizardId` field on the submission wire payload (`POST /qw/v1/submit`)
denotes the **service** that produced the submission. The terms "vertical,"
"wizard id," and "service" are interchangeable; on the wire the field name
remains `wizardId` to avoid a wire-contract change.

No payload structure changes in this step.

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

---

## Amendment — 2026-06-05: Endpoint path ownership (Step 5.2)

The `PublicConfig.restUrl` field emitted by PHP is the **REST namespace base URL**
(e.g. `http://example.com/wp-json/qw/v1`), NOT a full endpoint URL. The TypeScript
client owns the per-endpoint path: the submission port appends `/submit` before
issuing the POST.

This contract is now made explicit. Prior to Step 5.2 the two sides had drifted —
PHP emitted the namespace base, but `httpSubmissionPort` used it directly as the
POST target, producing a 404. The Step 5.2 fix appends `/submit` in the TS port.
A new test in `http-submission-port.test.ts` asserts the constructed URL ends
with `/submit`, preventing regression.

Future endpoints in the `qw/v1` namespace (idempotency, status query, etc.) will
follow the same pattern: PHP emits the namespace; TypeScript appends the per-
endpoint path.

---

## Amendment — Step 5.5a (June 7, 2026): wire contract version 3

`contractVersion` bumps from 2 to 3. The bump is additive: all existing fields
are preserved.

**New request fields (contractVersion 3):**

```json
{
  "contractVersion": 3,
  "wizardId": "string",
  "schemaVersion": 1,
  "quoteMode": "instant | manual",
  "answers": {},
  "pricing": { "totalPence": 0, "lowPence": 0, "highPence": 0, "currency": "GBP" },
  "clientTimestamp": "ISO-8601"
}
```

- `quoteMode` (required): `"instant"` or `"manual"`. Drives PHP validation of
  the pricing field.
- `pricing`: null/absent is accepted when `quoteMode = "manual"`. When
  `quoteMode = "instant"`, pricing must be present and valid (existing
  constraint, now enforced explicitly per quoteMode).

**Webhook payload (Forwarder → Make.com):** `quoteMode` is now forwarded in
the webhook body alongside the existing fields. Make.com workflows can branch
on `quoteMode` to route manual-quote submissions differently from instant
quotes.

**Lockstep requirement:** The PHP plugin and JS bundle must be deployed
together. The `SubmissionController` rejects requests with
`contractVersion !== 3` (400).

See ADR-0017 for the quoteMode capability rationale.
