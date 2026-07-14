# Business Owner Data Handling Guide

_Step 5.14. This guide is written for the business owner running this site — not a
developer — and describes their responsibilities and day-to-day actions under UK GDPR
and the Data Protection Act 2018._

## Your responsibilities under UK GDPR

As a business receiving customer data via the quote wizard, you have data protection
responsibilities:

1. Keep customer data secure.
2. Only use it for the purpose it was given for (providing a quote, and following up on
   that request).
3. Delete it when no longer needed — this now happens automatically (see Retention
   below).
4. Respond to customer requests to see, correct, or delete their data within 30 days.

## What data you have, and where it lives

For each customer submission you have: their name, phone, email, address, project
details, and any photos they uploaded, plus a timestamp of when they consented to their
data being processed.

There are two places this data lives, and they are **not the same record**:

- **Google Sheets** (via the Make.com automation) — this is your day-to-day working
  copy of every enquiry. It's the fastest way to find a specific customer.
- **The website's own database** (the canonical record, in the `wp_goqw_submissions`
  table) — this is what "actually exists" from a data-protection point of view, and
  what actually gets auto-deleted after the retention period.

There is currently no page inside `/wp-admin/` that lists submissions — the wizard
doesn't have a built-in submissions viewer. For anything beyond looking a customer up
in Google Sheets, you'll need your web developer or hosting provider's database tool
(phpMyAdmin or similar) to look at or delete a specific row in `wp_goqw_submissions`.

## How to handle data subject requests

### Right to access (they want to see their data)

Search Google Sheets for their email or phone number. Send them what you find:
contact details, the project details they gave you, and when they submitted. Respond
within 30 days.

### Right to erasure (they want to be forgotten)

1. Find and delete the row for that customer in Google Sheets.
2. Ask your developer (or use phpMyAdmin/hosting panel yourself, if you're comfortable)
   to delete the matching row from the `wp_goqw_submissions` table in the WordPress
   database. Any photos they uploaded are stored as ordinary WordPress media files and
   should be deleted from the Media Library at the same time.
3. Confirm to the customer that their data has been deleted.

Respond within 30 days.

### Right to rectification (they want to correct their data)

Update the row in Google Sheets. If it also needs correcting in the underlying
database, ask your developer to do that directly — there's no self-service edit screen
for this yet.

## Data retention (this is now automatic)

Quote request records are automatically deleted from the website's database 90 days
after submission (a daily background task — you don't need to do anything). Photos are
kept a little longer, up to 6 months, then deleted automatically too. This retention
period is a website setting your developer can adjust if you need a different window,
but shorter is generally safer from a compliance point of view, not longer.

Automatic deletion only clears the website's own database — it does **not** delete
rows from your Google Sheet. If you want your Sheet to reflect the same retention
policy, you're responsible for periodically clearing old rows there yourself.

## Consent

Every customer must tick a consent checkbox before they can submit a quote request —
they cannot submit without it. The website records the exact date and time they gave
consent, so you have evidence of it if ever asked.

## What NOT to do

- Don't sell customer data.
- Don't share it with anyone beyond the services already involved in running this site
  (Cloudflare, Make.com, WhatsApp/Meta — see the Privacy Policy for what each does).
- Don't keep data longer than the retention period, or manually copy it somewhere it
  will outlive that period without a good reason.
- Don't post customer information publicly.

## Contacting customers

You can contact a customer about:

- Their specific quote request.
- A reasonable follow-up on that request.

You should **not** contact them about marketing, unrelated services, or anything they
haven't asked about, unless they've separately and explicitly agreed to that.

## Keeping the Privacy Policy up to date

The Privacy Policy page (linked in the site footer, at `/privacy`) should reflect what
this guide describes. If you change how customer data is collected, used, or shared,
ask your developer to update the policy's content (and its "last updated" date) to
match — see `docs/llm-customization-handoff.md`.
