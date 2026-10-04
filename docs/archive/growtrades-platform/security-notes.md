# Security Notes for Business Owners

_Step 6.6. This is a short, non-technical companion to the plumbing already
described in [`business-owner-data-handling-guide.md`](business-owner-data-handling-guide.md)
(your GDPR responsibilities, retention, and data-subject requests). This
document is about a different question: **what protects you from someone
deliberately submitting malicious or abusive input through the quote
wizard**, and what to do if it happens anyway._

## What's protected

**Formula injection.** If a customer (or an attacker) enters something like
`=SUM(A1:A100)` or `=HYPERLINK("http://evil.example")` into a text field,
your Google Sheet displays it as plain text — it is never evaluated as a
formula. Your Google account and the rest of your spreadsheet are not put
at risk by opening a submission row.

**Malicious HTML/script content.** If someone enters `<script>...</script>`
or similar markup in a text field, it's stripped down to plain text before
it reaches the outbound webhook. If a future admin screen ever displays
submissions directly inside WordPress, this is also why: the underlying
WordPress escaping functions are the second layer of the same defense.

**Automated abuse.** Rate limiting (5 submissions per hour per IP, adjustable
in Settings) and a hidden honeypot field reject scripted flooding by
default. Cloudflare Turnstile (bot verification) is available as an
additional layer if you configure a Turnstile site key/secret in Settings —
without one configured, the honeypot and rate limit are still active on
their own.

**Duplicate submission abuse.** A second submission from the same email or
phone within 24 hours is recorded but not forwarded again, so repeatedly
"testing" the form doesn't multiply your WhatsApp/Sheets notifications.

**Database safety.** Every database query the plugin runs is built using
WordPress's parameterized query APIs — there is no way for text a customer
types to be interpreted as part of a database command.

## What's not protected

**Inappropriate photo content.** Uploaded photos are checked for a valid
image format (correct file type, real image data, reasonable dimensions),
but nothing stops someone from uploading a technically-valid image that's
offensive or unrelated to the job. You may see these in your Sheet; delete
them the same way you'd delete any unwanted row.

**Sheet/link sharing.** Your Google Sheet's URL is private, but not
individually authenticated per person — if you share the link (or the
underlying Google account) with someone, they can see every submission in
it, not just the ones relevant to them.

## What to do if you receive a concerning submission

- Delete the row from your Google Sheet.
- Delete the corresponding submission from the WordPress database (see
  "Right to erasure" in `business-owner-data-handling-guide.md` for how —
  the same steps apply whether the request comes from the customer or from
  you noticing something concerning yourself).
- If it looks like a deliberate attack rather than a one-off, mention it to
  whoever manages your hosting/Cloudflare account — they can tighten
  firewall rules if the volume becomes a problem.

## Reporting a security issue with the platform itself

If you believe you've found an actual security weakness in the wizard or
plugin (as opposed to an individual bad submission), contact the agency or
developer who set up your site rather than attempting to investigate or fix
it yourself.
