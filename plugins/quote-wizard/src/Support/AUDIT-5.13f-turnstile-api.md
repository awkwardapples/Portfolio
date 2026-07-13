# Audit D — Cloudflare Turnstile API Reference (5.13f)

_Performed: 2026-07-13_

## Client-side widget

`https://challenges.cloudflare.com/turnstile/v0/api.js` — loaded once, exposes a global
`window.turnstile` object with `render(container, options)`, `reset(widgetId)`, and
`remove(widgetId)`. `render()` returns a widget ID and accepts:

- `sitekey` (required) — public, safe for client-side HTML.
- `callback(token: string)` — fires when a token is issued.
- `error-callback()` — fires on widget error.
- `expired-callback()` — fires when an issued token expires (~5 minutes) before use;
  the widget auto-refreshes in managed mode but the previously-issued token becomes
  invalid — the callback should clear any stored token so a stale one is never
  submitted.
- `theme`, `size` — cosmetic only.

## Server-side verification

`POST https://challenges.cloudflare.com/turnstile/v0/siteverify`

Body (form-encoded, matches the spec's pseudo-code):

| Field      | Required | Notes                                                |
| ---------- | -------- | ---------------------------------------------------- |
| `secret`   | Yes      | Server-side secret key, never exposed to the browser |
| `response` | Yes      | The token from the widget's `callback`               |
| `remoteip` | No       | Optional — improves Cloudflare's risk signal         |

Response (JSON):

```json
{
  "success": true,
  "error-codes": [],
  "challenge_ts": "2026-07-13T12:00:00.000Z",
  "hostname": "example.com",
  "action": "",
  "cdata": ""
}
```

`error-codes` values (per Cloudflare's published reference): `missing-input-secret`,
`invalid-input-secret`, `missing-input-response`, `invalid-input-response`,
`bad-request`, `timeout-or-duplicate` (token already used, or expired), `internal-error`.

## Well-known test keys (public, documented by Cloudflare for automated testing)

These are safe to use in this codebase's test suite — they are Cloudflare's own
published dummy keys, not credentials:

| Purpose                         | Site key                   | Secret key                                                                |
| ------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| Always passes (visible widget)  | `1x00000000000000000000AA` | `1x0000000000000000000000000000AA`                                        |
| Always blocks (visible widget)  | `2x00000000000000000000AB` | `2x0000000000000000000000000000AA` (always fails)                         |
| Forces an interactive challenge | `3x00000000000000000000FF` | n/a                                                                       |
| Token already spent / timeout   | n/a                        | `3x0000000000000000000000000000AA` (always yields `timeout-or-duplicate`) |

`TurnstileClientTest.php` uses `wp_remote_post` mocking (Brain Monkey), not live network
calls, so these test keys are documentation only — no test in this suite hits Cloudflare's
real endpoint. That is consistent with how `SubmissionControllerTest.php` never hits a
real Make.com webhook either (`Forwarder` calls are always mocked/spied).

## The real site key provided for this deployment

The user's message includes a real Cloudflare Turnstile site key
(`0x4AAAAAAD08xGwhMXvPs1CQ` — does not match the `1x`/`2x`/`3x` test-key prefixes, so
it is a live widget key for some domain). Site keys are meant to be public — Cloudflare
embeds them directly in client-side HTML by design — so this is not a credential leak.
It is **not** hardcoded anywhere in source; per the existing per-client configuration
philosophy (`goqw_webhook_url`, `goqw_business_name`, etc.), it belongs in
`wp option update goqw_turnstile_site_key "0x4AAAAAAD08xGwhMXvPs1CQ"` at deployment
time, documented as an example value in `docs/llm-customization-handoff.md` Task 9,
alongside its paired secret key which the user has not shared (and which must be
entered directly during deployment, never committed to the repo).
