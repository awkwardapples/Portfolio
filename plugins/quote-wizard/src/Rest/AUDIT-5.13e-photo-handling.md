# Audit A — Current Photo Handling in the Submission Endpoint (5.13e)

_Performed: 2026-07-13_

## File examined

`plugins/quote-wizard/src/Rest/SubmissionController.php`

Note: the spec referenced `Submit.php`, but the actual file is `SubmissionController.php`
(same naming drift already noted in `AUDIT-5.12b-submit-buffering.md`). There is no
`Submit.php`.

## How photos enter the request

The React app sends `answers[fieldKey] = { files: [ { fileId, originalName, mimeType,
sizeBytes, width, height, dataBase64 }, ... ] }` for any photo-type field (currently only
`site_photos`, added in Step 5.13c). `dataBase64` is raw base64 or a `data:mime;base64,`
prefixed string (Step 5.12b).

## How photos are validated

`SubmissionController::handle()` calls `MediaValidator::validate($answers)` (Step 1b,
before persistence). See Audit B for validator detail. Validation runs against the
**entire answers map** — it walks every field looking for a `files` array, not just a
hardcoded `photos` key.

## How photos are persisted — the duplication

This is the critical finding for 5.13e. Photo data currently lands in **two places** in
the `wp_goqw_submissions` row, both still base64:

1. **`answers_json`** — `wp_json_encode( $answers )` in `validate()`
   ([SubmissionController.php:196](SubmissionController.php#L196)). Since `$answers` is
   the raw decoded payload, any `files[].dataBase64` inside it is stored verbatim here.
2. **`media_json`** — built separately by `extract_media_json()`
   ([SubmissionController.php:212-223](SubmissionController.php#L212-L223)), which walks
   `$answers` a second time, collecting `{ fieldKey, files }` for every field that has a
   `files` array. This is the **same base64 bytes**, duplicated.

Both columns are written by `SubmissionRepository::insert()` verbatim
([SubmissionRepository.php:44-65](../Submissions/SubmissionRepository.php#L44-L65)) — no
transformation happens between validation and persistence.

## Where photo data enters the webhook payload

`Forwarder::forward()` ([Forwarder.php:46-61](../Submissions/Forwarder.php#L46-L61))
decodes both columns back into the outbound JSON body:

```php
'answers' => json_decode( $payload['answers_json'], true ),   // still has dataBase64
'media'   => json_decode( $payload['media_json'], true ),     // same dataBase64, again
```

**Consequence for 5.13e:** replacing base64 with a URL only in `media_json` is not
sufficient — the `answers` blob sent to Make.com would still carry the original base64
under `answers.site_photos.files[].dataBase64`. The photo storage step must mutate the
`files[].dataBase64` entries **inside the answers array itself**, before both
`answers_json` and `media_json` are derived from it, so the URL replacement is reflected
in both encoded columns and consequently in both webhook payload keys.

## `ImageHandler.php` — dead stub, not part of this flow

`plugins/quote-wizard/src/Submissions/ImageHandler.php` is a Step-3D stub
(`ImageHandler::sideload()` throws `\LogicException` unconditionally, docblock says
"real implementation lands in Step 5.1"). Step 5.1 never implemented it — the project
went a different direction (browser-side compression + base64-in-payload, Step 4.8/5.13c)
instead of server-side `wp_handle_sideload`. `ImageHandler` is never referenced by
`Plugin.php`, `SubmissionController.php`, or any test outside its own stub. It is dead
code that predates and is superseded by the `PhotoStorage` class this step introduces.
Not deleted here (out of scope of the locked D1-D8 decisions) but flagged in ADR-0026.
