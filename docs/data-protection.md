# Data protection runbook

What Josh does when someone asks about their data, when a secret leaks, and how to check the contact pipeline (spec Q.5; ADR-0043). The privacy notice the public reads is `/privacy` (`apps/site/src/pages/privacy.astro`); keep the two consistent. This is not legal advice. Check with the ICO's self-assessment whether the data protection fee applies to you.

Where personal data lives:

| Place                                     | What                                                    | Kept                                       |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------ |
| Cloudflare D1, database `joshlennon-site` | each message (`submissions`), with consent time         | 90 days, deleted by the daily cron         |
| Cloudflare D1, `rate_limits`              | a keyed hash of the sender's address, never the address | until its hour ends, then deleted          |
| The Make.com scenario's history           | each forwarded copy                                     | Make.com's log retention (check your plan) |
| Google Sheet "Portfolio messages"         | one row per message                                     | as long as you need it                     |
| Your inbox                                | one email per message                                   | as long as you need it                     |

The visitor's browser also holds their homepage answer (`localStorage`, key `jl:intent`) and unsent form answers (`sessionStorage`). You never see these.

All commands below run from `apps/edge` after `pnpm exec wrangler login`. `wrangler d1 execute` takes plain SQL, so type the email address or reference into the quotes yourself rather than pasting text a visitor sent: nothing they wrote should become part of a command.

## Someone asks for a copy of their data

1. Find their messages by email (lower case, as stored):

   ```bash
   pnpm exec wrangler d1 execute joshlennon-site --remote --command "SELECT reference, intent, created_at, consent_timestamp, answers_json FROM submissions WHERE contact_email_norm = 'person@example.com'"
   ```

2. Search the Sheet and your inbox for the same address.
3. Reply within one month with what you found, in a readable form (a copy of the rows is fine).

## Someone asks you to delete their data, or withdraws consent

1. Delete their rows in D1:

   ```bash
   pnpm exec wrangler d1 execute joshlennon-site --remote --command "DELETE FROM submissions WHERE contact_email_norm = 'person@example.com'"
   ```

2. Delete their rows in the Sheet and their emails in your inbox (and its bin).
3. In Make.com, delete the scenario runs that carried their message if your plan keeps run history.
4. Reply to confirm, within one month.

To correct data instead, edit the Sheet row and reply; the D1 copy is deleted after 90 days anyway, or delete it as above.

## Checking the pipeline

Messages still waiting to be forwarded, and ones the Worker gave up on:

```bash
pnpm exec wrangler d1 execute joshlennon-site --remote --command "SELECT reference, status, forward_attempts, last_error, created_at FROM submissions WHERE status IN ('pending', 'forward_failed') ORDER BY created_at"
```

`forward_failed` rows were never delivered to Make.com; read them with the first query above and reply by hand. To have the cron try one again, set it back to pending:

```bash
pnpm exec wrangler d1 execute joshlennon-site --remote --command "UPDATE submissions SET status = 'pending', forward_attempts = 0, next_attempt_at = '2000-01-01T00:00:00.000Z' WHERE reference = 'JL-XXXXXXXX'"
```

Live logs from the Worker (no personal data is logged, only references and outcomes):

```bash
pnpm exec wrangler tail joshlennon-site
```

## A secret leaks

Treat any secret that appears in a file, a commit, a screenshot, a chat message or a log as public, and replace it at once.

| Secret                 | Replace it by                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `MAKE_WEBHOOK_URL`     | In Make.com, delete the webhook and create a new one (`docs/make-com.md` step 1); `wrangler secret put MAKE_WEBHOOK_URL` |
| `MAKE_WEBHOOK_SECRET`  | Choose a new value; update the scenario's filter first, then `wrangler secret put MAKE_WEBHOOK_SECRET`                   |
| `TURNSTILE_SECRET_KEY` | Dashboard > Turnstile > the widget > Rotate secret key; `wrangler secret put TURNSTILE_SECRET_KEY`                       |
| `RATE_LIMIT_SALT`      | Choose a new value; `wrangler secret put RATE_LIMIT_SALT` (current rate-limit windows reset, which is harmless)          |
| `CLOUDFLARE_API_TOKEN` | Cloudflare > My Profile > API Tokens > Roll; update the GitHub repository secret                                         |

Then check the Sheet and D1 for anything you did not expect, and, if personal data may have been exposed, consider whether the ICO must be told (within 72 hours of becoming aware, if the breach is likely to put people at risk).

## Photos of people

Photos of bandmates, badminton partners or classmates go on the site only with their agreement, and captions name only people who agreed (spec Q.5). `pnpm media:images` removes location data from every photo.
