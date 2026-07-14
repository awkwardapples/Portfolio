# Audit C — Forwarder Logic (5.13g)

Date: 2026-07-14
Step: 5.13g Phase 0 Audit C

## Where forward is called from

`SubmissionController::handle()`, Step 3, immediately after a successful DB insert
(Step 2). Exactly one call site in the whole plugin:

```php
$forward_result = $this->forwarder->forward( $submission_id, $validated );
```

## Gating conditions today

None inside `Forwarder` itself — `forward()` always attempts the HTTP call once a
webhook URL is configured (`resolve_webhook_url()`); the only internal short-circuit is
"no URL configured" → immediate `ForwardResult::failure('webhook_not_configured')`.
`Forwarder` has no awareness of submission state beyond the `$payload` array and
`$submission_id` it's given — it never reads from the database.

## Can it be conditionally skipped based on submission flags? — corrects a spec assumption

The spec's Implementation Plan §4.4 proposes modifying `Forwarder::forward()` to load
the submission by ID and check `$submission->is_duplicate`. This does not fit
`Forwarder`'s actual shape: it has no repository dependency, no DB access, and no
by-ID lookup method — adding one would duplicate `SubmissionRepository`'s job and widen
`Forwarder`'s responsibility for a check the caller already has the answer to (the
controller runs `DuplicateDetector::check()` before persisting and already holds the
result in a local variable at the exact point it decides whether to call `forward()` at
all).

**Deviation**: `Forwarder.php` is left unmodified. `SubmissionController::handle()` skips
the call to `$this->forwarder->forward(...)` entirely for a duplicate submission (Commit
4, not a separate Commit 5) — the same short-circuit style already used for bot
protection ("Step 0" in `handle()`, which returns before validation even runs). This is
simpler, keeps `Forwarder`'s "one webhook POST, no other awareness" contract intact, and
avoids a second, redundant DB round-trip per submission to re-fetch what the controller
already knows.
