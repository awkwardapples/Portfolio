# ADR-0026: Photo URL Storage

**Status:** Accepted (Step 5.13e, 2026-07-13)

## Context

Since Step 4.8, submission photos travel and persist as base64: the wire payload carries `dataBase64` per file, and `SubmissionController` writes that base64 into **two** columns on `wp_goqw_submissions` — `answers_json` (the raw answers blob, files still embedded) and `media_json` (the same files extracted separately, Step 4.8). `Forwarder` decodes both columns into the Make.com webhook body under `answers` and `media` keys — so every submission with photos sends the same base64 bytes to Make.com twice (see `AUDIT-5.13e-photo-handling.md`).

This is workable for JSON/webhook delivery but breaks down for the pilot's actual use of the data: Google Sheets `IMAGE()` formulas need a URL, WhatsApp templates need a URL, and the row size in both the DB and the webhook payload grows without bound as photos accumulate. There is also no expiry — `docs/current-state.md` has listed "Media retention policy" as deferred since Step 4.8.

## Decision

Save submission photos to the WordPress media library and store their public URL instead of base64, with automatic 6-month retention.

**D1 — Storage location.** A dedicated `PhotoStorage` class (`Submissions/PhotoStorage.php`) decodes validated base64 to a temp file and routes it through `wp_handle_upload()` into `/wp-content/uploads/goqw/YEAR/MONTH/`, using a scoped `upload_dir` filter added immediately before the call and removed immediately after.

**D2 — Public URLs.** No signed URLs or authentication for the pilot. `wp_get_attachment_url()` returns an ordinary public URL. Documented as a known tradeoff (see Consequences).

**D3 — 6-month retention.** New `Cron\PhotoRetention` (`src/Cron/PhotoRetention.php`) queries attachments tagged with `PhotoStorage::PHOTO_META_KEY` (`_goqw_photo`) older than 6 months and deletes them via `wp_delete_attachment()`. Scheduled daily in `Activator`, hooked to `goqw_photo_retention_cleanup` in `Plugin::boot()`. Unlike `Cron\PruneSubmissions` — a Step-3D stub whose event is scheduled but whose callback was never hooked and does nothing (`AUDIT-5.13e-cron-pattern.md`) — `PhotoRetention` is a complete, real implementation.

**D4 — No compression.** Photos are stored exactly as validated by `MediaValidator`; no server-side resizing or re-encoding.

**D5 — Per-photo failure does not block submission.** If `PhotoStorage::store_photo()` fails for a given file, `SubmissionController::store_photos()` drops that file from its field's `files` array and logs via `Logger::operational()`. The submission is never blocked by a photo storage failure — the business still receives the lead, just without that photo.

**D6 — Orphan cleanup.** `store_photos()` runs, and any attachments it creates, before `SubmissionRepository::insert()`. If `insert()` then throws, the submission row never exists, so those attachments are orphaned; `SubmissionController` deletes them via `PhotoStorage::delete_photo()` in the `catch` block. A forward failure (502) does **not** trigger cleanup — the submission row exists in that case, so the photos are correctly retained.

**D8 — MediaValidator unchanged.** Validation (size, MIME allowlist, base64 decode, magic-byte, dimensions) still runs on the raw base64 before `PhotoStorage` ever sees it (`AUDIT-5.13e-media-validator.md`). `PhotoStorage` does not re-validate; it only handles the mechanics of getting already-trusted bytes into the media library.

**Ordering (`SubmissionController::handle()`):** validate shape → `MediaValidator::validate()` (base64, still present) → `store_photos()` (base64 → media library, mutates answers) → encode `answers_json`/`media_json` from the mutated answers → `SubmissionRepository::insert()` → `Forwarder::forward()`. This closes the base64 duplication: both `answers_json` and `media_json`, and consequently both the `answers` and `media` keys in the webhook payload, now carry the URL, not base64.

**Wire/payload shape change** — per file entry:

```
// Before                          // After
{ fileId, dataBase64,       →      { fileId, url, attachmentId,
  mimeType, originalName }           mimeType, originalName }
```

## Consequences

**Positive:**

- Google Sheets `IMAGE()` and WhatsApp templates can use the URL directly.
- Submission rows and webhook payloads no longer grow unbounded with photo count.
- 6-month retention is automatic; no manual cleanup step for the agency operator.
- No lead is lost to a photo storage failure (D5) or left with dangling media on a failed submission (D6).

**Negative / accepted tradeoffs:**

- Photo URLs are public with no signing (D2) — acceptable for the pilot; flagged for `docs/llm-customization-handoff.md` and revisit in Step 5.14 (privacy policy).
- `wp-cron`'s reliability depends on site traffic (pseudo-cron, no real traffic = no tick). Same characteristic `goqw_prune_submissions` already has; not a new risk.
- One more DB round-trip risk surface: `MediaValidator` and `PhotoStorage` must run in that exact order, or validation checks nothing meaningful (documented in code and in `AUDIT-5.13e-media-validator.md`).

## Not in scope

- Photo compression/resizing or thumbnail generation (D4).
- Signed/authenticated URLs (D2).
- Changes to the Make.com scenario itself — a URL in the same JSON position as base64 is transparent to Make; only the Google Sheets `IMAGE()` formula needs a manual config update (documented in `docs/llm-customization-handoff.md`) to read `url` instead of `dataBase64`.
- Spam/bot protection (Step 5.13f) and idempotency/duplicate prevention (Step 5.13g) — unrelated, separately deferred.

## Housekeeping note

`Submissions/ImageHandler.php` is a dead Step-3D stub (`sideload()` throws `\LogicException` unconditionally; its docblock says "real implementation lands in Step 5.1", which never happened — Step 4.8/5.13c went the base64-in-payload direction instead). It predates and is superseded by `PhotoStorage`. Not referenced anywhere. Not deleted in this step (out of scope of the locked decision set) but flagged here for a future cleanup pass.

## Cross-references

- ADR-0001 (thin WP REST endpoint), ADR-0005 (sync forwarder), ADR-0015 (submission pipeline)
- ADR-0007 (operational security discipline — MIME allowlist, magic-byte verification)
- `AUDIT-5.13e-photo-handling.md`, `AUDIT-5.13e-media-validator.md`, `AUDIT-5.13e-wp-media-integration.md`, `AUDIT-5.13e-cron-pattern.md`
