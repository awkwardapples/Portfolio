# Architecture

**Version:** 1.0
**Status:** Proposed — awaiting Phase 1 approval

---

## 1. Architectural principles

These are the rules every implementation decision is measured against. When two principles conflict, the one higher on this list wins.

1. **Reliability over cleverness.** A boring component the agency can debug at 9pm beats a clever one that requires reading framework docs.
2. **Client-owned data.** Every piece of customer data should live somewhere the client controls (WordPress media library, HubSpot, their inbox). The agency should not be a single point of failure for the client's lead data.
3. **No secrets in the browser.** The React bundle is public. Any token, key, or webhook URL that grants write access lives behind the WordPress REST endpoint, not in the bundle.
4. **Configuration over code.** Anything that varies between clients (pricing, copy, branding, trade type, contact details) is configuration. The wizard component code does not change between clients in v1.
5. **Graceful degradation.** If Make.com is down, the submission still lands in WordPress. If image upload fails, the text submission still succeeds. If JavaScript fails to load, the page still renders meaningful content.
6. **Boring stack, sharp edges.** WordPress, React, TypeScript, Make.com, HubSpot. No exotic dependencies. Where we add a library, we justify it.

## 2. System components

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Browser (homeowner)                        │
│                                                                     │
│   WordPress page (Kadence theme)                                    │
│   ├─ Static content (homepage, services, local pages)               │
│   └─ <div id="qw-root"> ← React wizard mounts here                  │
│                                                                     │
│   React app (Vite-built, ~150KB gzipped target)                     │
│   ├─ Wizard engine (config-driven)                                  │
│   ├─ Pricing engine (pure TypeScript)                               │
│   ├─ Form state (React Hook Form + Zod)                             │
│   └─ Image compressor (browser-image-compression)                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS, multipart/form-data
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  WordPress (Cloudways / DigitalOcean)               │
│                                                                     │
│   Plugin: quote-wizard                                              │
│   ├─ REST endpoint: POST /wp-json/qw/v1/submit                      │
│   │    ├─ Nonce + rate-limit check                                  │
│   │    ├─ Validate payload (server-side mirror of client validation)│
│   │    ├─ Store images → WP media library                           │
│   │    ├─ Build structured payload                                  │
│   │    └─ POST → Make.com webhook                                   │
│   ├─ Shortcode/block: [quote_wizard]                                │
│   ├─ Settings: webhook URL, API keys (wp_options, encrypted)        │
│   └─ Submission log (custom DB table, last 90 days)                 │
│                                                                     │
│   Theme: Kadence (presentation layer for static pages)              │
│   SEO: RankMath (sitemap, schema, meta)                             │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS, JSON
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            Make.com                                 │
│                                                                     │
│   Scenario: lead-intake                                             │
│   ├─ Webhook trigger                                                │
│   ├─ Router                                                         │
│   │    ├─ → HubSpot: create/update contact                          │
│   │    ├─ → Email (owner): SMTP / Gmail module                      │
│   │    ├─ → Email (customer): SMTP / Gmail module                   │
│   │    └─ → SMS (optional): Twilio module                           │
│   └─ Error handler → email agency ops inbox                         │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Why each piece is where it is

### 3.1 Why WordPress as the host

The client wants to edit copy, add service-area pages, and feel ownership of their site. WordPress + Kadence + RankMath is the lowest-friction stack for that. The trades business owner has likely seen WordPress before; they have not seen Strapi or Sanity.

### 3.2 Why React inside WordPress (not Next.js, not a static site)

The wizard is interactive, stateful, and conditional. It is not a candidate for server rendering — its content is dynamic per-user, not per-URL. Building it as a static React island embedded in WordPress gives us:

- The SEO and content-editing strengths of WordPress for the 95% of the site that is content
- A clean, modern, testable component model for the 5% of the site that is interactive
- A clear deployment boundary: the React app builds to a single JS + CSS file pair, and the plugin enqueues them

Next.js would force us to either host the whole site on Vercel (loses WordPress) or run a headless setup (10x complexity for no v1 benefit).

### 3.3 Why a thin WP REST endpoint (Path B)

Confirmed in the decision log. The endpoint exists for four reasons:

1. **Secret containment.** The Make.com webhook URL is not a secret in the strictest sense, but it is unauthenticated and rate-limited per scenario. Putting it behind a WordPress endpoint means we can add nonce checks, rate-limiting, and abuse mitigation without redeploying the React bundle.
2. **Image storage.** Multi-image base64 over a Make.com webhook is fragile. Uploading via the WP REST API to the media library is robust, gives the client visibility in wp-admin, and produces stable image URLs we can pass to Make.com as strings.
3. **Submission log.** A `qw_submissions` table storing the last 90 days of submissions (text only, not images) is our debugging lifeline when a Make.com scenario fails. Without it, a failed automation is a lost lead with no recovery path.
4. **Decoupling.** If we replace Make.com with n8n or Zapier later, only the plugin changes. The React bundle and the client's site are untouched.

### 3.4 Why Make.com (not Zapier, not n8n)

Make.com gives us visual routers, error handling, and a price point that works for an agency running 5–20 client scenarios. Zapier is more expensive per operation at our volume. n8n is more powerful and self-hostable but introduces an ops burden the agency does not need yet. If a client outgrows Make.com, we migrate that one client; the architecture supports it because the contract is "POST a JSON payload to a webhook URL."

### 3.5 Why HubSpot free tier

The client's CRM needs in v1 are: store contacts, see lead source, log notes, basic email tracking. Free tier covers it. The first time a client legitimately needs Marketing Hub or Sales Hub Starter, they will gladly pay the £15–£40/month — but we do not commit them to it on day one.

## 4. The WordPress ↔ React boundary

This is the most important contract in the system. Get it wrong and every future change costs double.

### 4.1 What WordPress is responsible for

- Hosting the page that contains the wizard
- Enqueueing the wizard's JS and CSS assets
- Rendering the mount point `<div id="qw-root" data-config="…">`
- Passing initial config to the React app via the `data-config` attribute (or a `window.qwConfig` global, set in a localised script)
- Providing the REST endpoint for submissions
- Providing a nonce via `wp_localize_script` for the React app to include in submission requests

### 4.2 What React is responsible for

- All UI inside `#qw-root`
- All wizard state and step logic
- All pricing calculation
- All client-side validation
- Image compression before upload
- Building the multipart/form-data submission
- Displaying success/error states

### 4.3 What crosses the boundary

```
WP → React (at mount):
  - Pricing config (JSON, bundled at build time OR injected via wp_localize_script)
  - WordPress REST nonce
  - REST endpoint URL
  - Optional: branding overrides (primary colour, business name) from plugin settings

React → WP (at submission):
  - POST /wp-json/qw/v1/submit
  - multipart/form-data with:
      - JSON field "data" containing the full structured submission
      - Image files attached as "photos[]"
  - Headers: X-WP-Nonce
```

The pricing config travels with the React build by default. If we later want clients to edit pricing without a redeploy, we move it to `wp_options` and inject it via `wp_localize_script`. The component code does not care which.

## 5. Data flow: a single submission

1. Homeowner completes the wizard. React validates each step client-side using Zod schemas.
2. On the final step, the user reviews the estimate, ticks the consent checkbox, and submits.
3. React compresses each image client-side using `browser-image-compression` (target: max 1600px on long edge, max 500KB per image).
4. React builds a `FormData` object containing a JSON-stringified `data` field and `photos[]` files.
5. React POSTs to `/wp-json/qw/v1/submit` with the WP nonce header.
6. The WP endpoint validates the nonce, applies rate limiting (max 3 submissions per IP per 10 minutes), and runs server-side validation matching the client Zod schemas.
7. Images are sideloaded into the WP media library via `wp_handle_sideload`. Each gets a public URL.
8. The endpoint inserts a row into `qw_submissions` with the full payload and image URLs.
9. The endpoint POSTs a JSON payload to the Make.com webhook URL stored in the plugin settings. The HTTP request has a 5-second timeout and 2 retries on 5xx.
10. The endpoint returns `200 { ok: true, submissionId }` to React regardless of whether Make.com succeeded — the submission is durably stored in WordPress and we have a separate alerting path for Make.com failures.
11. Make.com receives the webhook, routes to: HubSpot (create/update contact), owner email, customer email, optional SMS.
12. If any Make.com module fails, the scenario's error handler sends an alert to the agency ops inbox with the submission ID for manual recovery.
13. React shows the success screen with the estimate range and next-step CTA.

## 6. Security model

| Threat | Mitigation |
|---|---|
| CSRF on the submit endpoint | WordPress nonce verified in the REST handler |
| Spam / bot submissions | Honeypot field + time-to-submit check + per-IP rate limit; reCAPTCHA v3 added only if abuse is observed |
| Malicious file uploads | MIME type allowlist (jpeg, png, webp), size cap (8MB per file pre-compression), `wp_check_filetype_and_ext` |
| XSS via wizard input | All output sanitised; React escapes by default; PHP output uses `esc_html` / `esc_url` |
| Make.com webhook URL leakage | Stored in `wp_options` with autoload disabled; not exposed to the frontend; rotated if compromised |
| HubSpot token leakage | Stored in Make.com connection store; never sent to WordPress or the browser |
| Plugin code execution | Plugin follows WP security guidelines; capabilities checked on admin actions; no `eval`, no `unserialize` on untrusted input |
| Submission log data exposure | `qw_submissions` table is admin-only via wp-admin UI; phone numbers and emails redacted in non-admin views |

## 7. GDPR / compliance model

The architecture treats GDPR as a first-class concern, not a checkbox.

- **Consent.** The wizard's final step includes a required consent checkbox: "I agree to [Business Name] contacting me about this quote and storing the information I have provided." Unchecked = submit button disabled.
- **Privacy policy link.** The consent label links to a privacy policy page maintained on the client's WordPress site. A template page ships with the plugin as a draft.
- **Data minimisation.** The wizard asks only what is needed to produce an estimate and follow up. No date of birth, no marketing-interest checkboxes, no demographic data.
- **Retention.** The `qw_submissions` table is automatically pruned after 90 days via a daily WP-Cron job. HubSpot data retention is the client's responsibility, documented in the operational playbook.
- **Right to erasure.** A documented wp-admin process lets the client delete a submission (and associated images) on request. Make.com data retention is configured to the minimum (3 days for execution history).
- **Subject access.** The submission log shows the client all data we hold per email address.
- **Data processor agreement.** A template DPA between the agency and the client is included in the operational playbook, identifying Make.com and HubSpot as sub-processors.

## 8. Performance budget

These are budgets, not targets. They are the line we do not cross.

| Metric | Budget | Rationale |
|---|---|---|
| Wizard JS bundle (gzipped) | ≤ 180KB | Mobile 4G should reach interactive in under 2s |
| Wizard CSS (gzipped) | ≤ 20KB | Tailwind purged to used classes only |
| Time to interactive on the wizard page (4G, mid-tier Android) | ≤ 3s | Conversion drops sharply past this |
| Largest Contentful Paint (homepage) | ≤ 2.5s | Core Web Vitals "Good" threshold |
| Cumulative Layout Shift | ≤ 0.1 | Same |
| Submit endpoint p95 latency (excluding Make.com forward) | ≤ 800ms | Image sideload is the slow path; we time-box it |
| Make.com forward timeout | 5s | If Make.com is slow, we still return to the user fast |

## 9. Observability

A system you cannot observe is one you cannot maintain. The agency operations rely on this.

- **WordPress level.** The submission log table is the primary diagnostic. The plugin includes a wp-admin page listing recent submissions, their forwarded status, and any error message from the Make.com call.
- **Make.com level.** Scenario execution history is the secondary diagnostic. The agency dashboard bookmarks the relevant scenarios for each client.
- **Uptime.** UptimeRobot (free tier) pings the homepage every 5 minutes and the wizard page every 15 minutes per client. Alerts go to the agency ops inbox.
- **Error reporting.** A lightweight client-side error reporter in the React app catches unhandled exceptions and POSTs them to a `/wp-json/qw/v1/error` endpoint, which logs to a separate table. Optional: forward to Sentry free tier if volume warrants it.
- **Analytics.** GA4 + Microsoft Clarity (both free). Funnel: page view → wizard start → step 1 complete → … → submit. This is the conversion-optimisation feedback loop.

## 10. The reusability seams

Where, exactly, do we draw the lines so client #2 takes 2 days, not 2 weeks?

| Seam | What varies | What is shared |
|---|---|---|
| Pricing config | The numbers, the question list, the trade type | The engine, the config schema, the validation |
| Branding | Primary colour, business name, logo, contact details | All component code, all layout |
| Content (WP pages) | Copy, images, service areas | Page templates, schema markup, SEO patterns |
| Make.com scenario | Webhook URL, HubSpot account, email recipients | The scenario shape (blueprint JSON) |
| Plugin instance | Plugin slug (`qw-clientname`), settings values | All PHP code |

What this means in practice:
- Deploying client #2 means cloning the plugin repo, renaming the slug, importing the Make.com blueprint, editing one JSON config file, and a `npm run build`.
- It does **not** mean editing React component code.
- It does **not** mean rewriting the Make.com scenario.
- If we find ourselves doing either, we have found a seam that needs strengthening, and we update the architecture before the next deployment.
