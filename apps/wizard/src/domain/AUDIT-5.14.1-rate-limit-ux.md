# Audit C — Client-Side Rate Limit Response Handling (5.14.1)

_Performed: 2026-07-17_

## Server contract (unchanged, Step 5.13f)

`Rest\SubmissionController::bot_protection_error_response()`
([SubmissionController.php:398](../../../../plugins/quote-wizard/src/Rest/SubmissionController.php#L398))
returns, for a rate-limited request:

```
HTTP 429
{ "errorCode": "rate_limited", "retryAfterSeconds": <int> }
```

This has been correct since Step 5.13f. The bug is entirely client-side.

## How the response is parsed today

`httpSubmissionPort.mapResponse()`
([http-submission-port.ts:133](../../runtime/http-submission-port.ts#L133))
branches on `response.status`:

```ts
if (response.status === 200) { ... }
if (response.status === 502) { ... }
if (response.status === 400 || response.status === 422) { ... }
if (response.status === 401 || response.status === 403) { ... }
return err_(ERR_SERVER, MSG_FALLBACK);   // <-- 429 falls through to here
```

**There is no `429` branch.** A rate-limited response falls through to the final
`return`, which discards the response body entirely (both `errorCode` and
`retryAfterSeconds` are read from `body` but `body` is never inspected for this
case) and returns the generic `server_error` code with `MSG_FALLBACK`
(`"Submission could not be completed. Please try again."`).

## What triggers "Something went wrong"

`FailureScreen` ([FailureScreen.tsx:31](../../components/screens/FailureScreen.tsx#L31))
renders a hardcoded heading `"Something went wrong"` for every
`SubmissionErrorInfo`, with the body message coming from `error.message` — which,
for a 429, is the generic `MSG_FALLBACK` text described above, and a visible
"Try again" button (`error.retryable` defaults `true` for `server_error` via
`err_()`'s default parameter). A user who is rate-limited sees the same
"Something went wrong / Try again" experience as a genuine server failure — with
a retry button that will fail again for up to an hour, since nothing tells them
to wait.

## Where retry-after data would be extracted

The 429 response body already carries `retryAfterSeconds` (a plain integer,
same shape as `bot_protection_error_response()` returns it — no client-side
guessing needed). It should be extracted the same way `extractMediaIssues()`
extracts `mediaIssues` for a 400: read the parsed `body` object, look up the key,
narrow the type, default safely if absent/malformed.

## How to display it to the user

`SubmissionErrorCode` ([state.ts:65](../runtime/state.ts#L65)) needs a
`'rate_limited'` member so the port can report a code distinct from
`server_error`. `FailureScreen` needs to special-case that code: a different
heading ("Please wait a moment" — not "Something went wrong", since nothing
actually went wrong) and no retry button (retrying immediately cannot succeed
until the window expires, unlike every other retryable error in this codebase).
The message text itself continues to be built client-side (matching the
existing `MSG_FALLBACK`/`MSG_FORWARDER` pattern — the server never sends prose
to the client, only codes and numbers) as "Please try again in N minute(s)."
computed from `retryAfterSeconds`.

## Fix implemented

1. `SubmissionErrorCode` gains `'rate_limited'`.
2. `mapResponse()` gains a `response.status === 429` branch that extracts
   `retryAfterSeconds` from the body and builds the wait-time message;
   `retryable: false`.
3. `FailureScreen` renders "Please wait a moment" instead of "Something went
   wrong" when `error.code === 'rate_limited'`, and hides the retry button
   (already conditional on `canRetry`, which is now `false` for this code).
