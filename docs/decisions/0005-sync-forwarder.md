# ADR-0005: Synchronous-blocking Make.com forwarder

**Status:** Accepted (supersedes the earlier proposal in `02-architecture.md` §5 step 10)
**Date:** 2026-05-11

## Context

The original architecture proposed that the WordPress submit endpoint would:

1. Validate and persist the submission to the `qw_submissions` table.
2. Store uploaded images in the WP media library.
3. POST the payload to the Make.com webhook with a 5-second timeout and 2 retries on 5xx.
4. **Return `200 { ok: true, submissionId }` regardless of whether the Make.com forward succeeded.** Failures of the forwarder would be logged and alerted to an agency ops inbox; the user would always see success.

This was challenged on review. The objection: a user who sees "success" on the screen but whose lead has not actually reached HubSpot or triggered any email is being told a lie. From their perspective, they expect to hear back; from the trades business's perspective, the lead is invisible until the agency manually processes the error queue.

## Decision

The forwarder is **synchronous-blocking on the user response**. Specifically:

1. The WordPress endpoint validates and persists the submission to the database. This always happens first and is durable.
2. Images are sideloaded into the WP media library. Always.
3. The endpoint then POSTs to the Make.com webhook with a 5-second timeout. On 5xx, one retry with a 1-second delay.
4. **If forwarding succeeds:** the endpoint returns `200 { ok: true, submissionId, forwarded: true }`. The React app shows the success screen.
5. **If forwarding fails:** the endpoint returns `502 { ok: false, error: "forwarder_failed", submissionId, fallback: { phone: "...", email: "..." } }`. The React app shows a recoverable error state with fallback contact details.

The submission is stored in WordPress regardless of forwarder outcome. No lead is ever lost. But the user sees the truth.

## Why this matters

The original proposal optimised for one user-visible property (the user always gets a happy success screen) at the cost of two more important properties:

- **Trust honesty.** Telling someone their submission went through when downstream automation failed creates a delayed disappointment. They wait for a callback that does not come because the lead never reached HubSpot or triggered the owner notification.
- **Operational visibility.** A silent-success policy makes Make.com failures invisible to the user, who is the most reliable detector of "my lead did not reach anyone." Pushing failures into an agency ops queue means they sit until the agency notices.

The revised behaviour:

- Reliability is unchanged: the submission is still durably stored.
- The user is told the truth: success means the full chain worked; an error message with a phone number means "we have your details, please also call us / we will follow up by call."
- The trades business owner sees the agency-ops alert immediately and can recover manually, with the user's awareness rather than behind their back.

## Alternatives considered

**Original "always return success" model.**

- Pros: simplest user-facing UX; one happy path.
- Cons: dishonest under failure; delays detection; erodes trust the first time a downstream failure happens.

**Async-only "submission queued" model.**

- The endpoint persists, returns 202 immediately, and a separate WP-Cron job forwards asynchronously.
- Pros: even faster user response time.
- Cons: now the React app has no way to know if HubSpot was reached. Either we accept the silent-failure pattern again (no improvement) or we'd have to poll for status (significant added complexity). The synchronous model gives the user truth without the polling architecture.

**Client-side retry on 502.**

- Considered. Decided against for v1: the React app will show the error state with a "Try again" button (which re-submits if the user chooses) and a phone-number fallback. Automatic retry could mask transient issues that the agency should learn about. Manual user-initiated retry is honest.

## React app contract

The React app's submission handler distinguishes three outcomes:

| Server response                                | UI shown                                                                                                                                                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `200 { ok: true, forwarded: true }`            | Success screen with estimate range and CTA.                                                                                                                                                                              |
| `502 { ok: false, error: "forwarder_failed" }` | Recoverable error state: "We've received your details and they're safe with us. There was a technical hiccup notifying the team — please also call **`<phone>`** or we'll be in touch shortly." Includes a Retry button. |
| Network error / 5xx other / timeout            | Generic error: "Something went wrong. Please try again, or call **`<phone>`**." Submit button re-enabled.                                                                                                                |

The submission ID is included in the 502 response so the user could reference it if they call — primarily an operational aid for the trades business.

## Consequences

**Easier:**

- The user always sees the truth.
- The trades business has no invisible failure queue accumulating.
- Debugging is symmetric: client error states correspond 1:1 with server outcomes.

**Harder:**

- The forwarder being synchronous adds latency to the user-visible response. The 5-second timeout is the worst-case wait. Mitigation: a loading state on the submit button with clear "Sending your details…" copy. Most successful forwards complete in <2s.
- The React app must handle three outcomes instead of two. This is honest complexity, not accidental complexity.

**To revisit:**

- If average forwarder latency exceeds 3s on real production traffic, we reconsider an async/eventual-consistency model with explicit polling.
- If Make.com proves to be more flaky than expected, we look at queue-and-retry with a "we'll let you know" model — but only after we have real failure data.
