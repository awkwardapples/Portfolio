# Risk Analysis

**Version:** 1.0
**Status:** Proposed

---

## How risks are scored

| Likelihood | Impact | Score |
|---|---|---|
| **L** (rare, requires multiple things to go wrong) | **L** (annoying, no business impact) | Low |
| **M** (plausible within a year) | **M** (operational pain, recoverable) | Medium |
| **H** (likely / will happen) | **H** (lost leads, client trust damage) | High |
| | **C** (critical — data loss, GDPR breach, prolonged outage) | Critical |

A High-likelihood × Medium-impact risk gets more attention than a Low-likelihood × Critical one. Mitigation effort is proportional to the score.

Risks are ordered by score, highest first.

---

## R1 — Make.com operation quota exhaustion

**Likelihood:** H | **Impact:** H | **Score:** High

**Description.** Make.com's free tier provides 1,000 operations per month; the Core plan is 10,000/month at €9. Our scenario uses approximately 4–6 operations per submission (webhook trigger + router + 3–4 action modules). At 100 submissions/month, a single client consumes 400–600 operations. With multiple clients on one Make.com account, the free tier is exhausted within a month or two. When the quota is exhausted, the scenario silently stops running — submissions still land in WordPress but no HubSpot contact, no email, no SMS.

**Detection.** Make.com sends an email at 80% quota; the agency must monitor this. Without monitoring, the first sign is a client phoning to ask why they stopped getting leads.

**Mitigation.**
- **Per-client Make.com accounts**, not one shared agency account. Each client gets their own Make.com login on a Core plan. The €9/month is rolled into the client retainer.
- **Plugin-side fallback.** The submission log table means a quota outage is never "lost lead" — it is "manual recovery": the agency can export submissions from wp-admin and process them by hand.
- **Operational alert.** Daily check (manual or scripted) that compares the count of submissions in WordPress against the count of executions in Make.com for that day. Any divergence triggers an investigation.
- **Documented runbook** for what to do when Make.com fails (in `docs/operations.md`).

**Residual risk.** Acceptable. The €9/month per client is a small line item, and the submission log gives us a recovery path even if the alert is missed.

---

## R2 — HubSpot free tier limits

**Likelihood:** H | **Impact:** M | **Score:** Medium-High

**Description.** HubSpot's free tier limits include: 1,000,000 contacts (not a v1 concern), 5 active workflows (zero in v1, but the client will want some), limited custom property count, no automated lead rotation, no email tracking insights, no SLA. As clients use HubSpot more, they hit ceilings.

**Mitigation.**
- **Stay free-tier compatible in v1.** No reliance on workflows, sequences, or paid-tier features in our integration. Make.com handles the workflow side.
- **Document the upgrade path.** Operations doc explains what HubSpot Starter (£15/month) buys the client and when to recommend it.
- **Custom properties used sparingly.** Only the properties we genuinely need (estimate range, trade type, lead source, submission ID). Document them in `automation/hubspot/contact-properties.md` so we don't accumulate cruft.

**Residual risk.** Acceptable. The system functions on free HubSpot; upgrade is a client commercial decision, not a technical blocker.

---

## R3 — Hosting environment variance across clients

**Likelihood:** H | **Impact:** M | **Score:** Medium-High

**Description.** Even with Cloudways as the agreed floor, individual client environments will drift: different PHP versions, different sets of installed plugins (the client adds something), different SMTP setups, different SSL certs. Plugin conflicts and PHP version drift are the most common WordPress support tickets.

**Mitigation.**
- **PHP 8.1 minimum, 8.2 recommended.** Documented in plugin header (`Requires PHP: 8.1`). Plugin will refuse to activate on older versions.
- **WordPress 6.4 minimum** (same enforcement mechanism).
- **No conflict with major plugins.** Test the wizard plugin alongside common ones: Yoast (we use RankMath, but some clients have Yoast already), Elementor, WPRocket, WP Super Cache. Document any known conflicts.
- **Plugin allowlist policy.** Documented for clients: which plugins the agency considers safe vs. which require approval. Adding Elementor's form addon next to our wizard is asking for trouble.
- **Reproducible local dev.** `wp-env` configuration committed so every engineer develops against the same WP/PHP versions.
- **Staging environment mandatory.** Every Cloudways production has a staging clone. Plugin updates go to staging first.

**Residual risk.** Medium. Client agency over their own WordPress install is a permanent source of small support tickets. The retainer covers this.

---

## R4 — GDPR / data-protection breach

**Likelihood:** L | **Impact:** C | **Score:** Medium

**Description.** We collect personal data (name, email, phone, address, photos of property) and process it via third-party sub-processors (Make.com, HubSpot, SMTP provider). A breach, a missed deletion request, or an unconsented use is a regulatory and reputational disaster — for the client and for the agency.

**Mitigation.**
- **Consent is required and recorded.** The wizard's consent checkbox state is stored with the submission. We can prove consent for any given lead.
- **Data minimisation.** We only ask what we need. No DOB, no marketing-checkbox creep.
- **Retention by default.** Submission table auto-prunes at 90 days. Make.com execution history retained for 3 days. HubSpot data retention is client policy, documented.
- **Right-to-erasure workflow.** Documented in operations runbook. Tested in Phase 6.
- **DPA template.** Between the agency and the client, identifying Make.com, HubSpot, and the SMTP provider as sub-processors. Each of those has their own DPA published, linked in our DPA template.
- **No data on agency systems.** The agency does not store client lead data on agency-owned infrastructure. Everything lives in the client's WordPress, the client's HubSpot, the client's Make.com.
- **Privacy policy template.** Provided as a starting point; the client must have their own legal review.
- **Encrypted secrets at rest.** Webhook URLs and tokens stored in WP options with autoload disabled; HubSpot tokens stored only in Make.com's connection vault.

**Residual risk.** Low-medium. Our architecture supports GDPR but compliance is operational, not just technical. The agency must follow the runbook.

---

## R5 — Plugin update breaks a deployed client site

**Likelihood:** M | **Impact:** H | **Score:** Medium

**Description.** We push a fix or feature to the plugin; an edge case we didn't test breaks the wizard on a live client; client loses leads for hours before noticing.

**Mitigation.**
- **Versioned, manual updates.** The plugin is not auto-updated. Each client update is a deliberate action: deploy to staging, test, deploy to production.
- **Plugin ZIPs versioned in GitHub releases.** Rollback is "upload the previous ZIP." Every prior version is one download away.
- **Test matrix.** Before any release, the test matrix covers: PHP 8.1 + 8.2, WP latest + previous, plugin alone + alongside common plugins. Tracked in CI eventually; manual at first.
- **Submission log as canary.** A drop in submissions after a deploy is a leading indicator of breakage. Monitored as part of weekly client reporting.
- **Feature flags for risky changes.** When introducing a non-trivial change (e.g. a new step type), it's behind a config flag, off by default.

**Residual risk.** Medium. Real risk, real mitigation, not eliminated.

---

## R6 — Reusability trap: we under-invest in seams, then duplicate effort

**Likelihood:** M | **Impact:** M | **Score:** Medium

**Description.** We agreed to build for client #1 and extract reusability after learnings. The risk: by client #3, we have three slightly different forks of the plugin, three slightly different React builds, and no clean upgrade path. The "extract later" plan never executes because there's no clear moment to stop and refactor.

**Mitigation.**
- **A single shared plugin codebase.** Each client deployment is a build of the same repo at a tagged version, not a fork. Per-client values live in plugin settings and the config JSON, not in code.
- **No `if (client === "acme")` branches.** Ever. Spotting one in code review blocks the PR. The right answer is always: lift the variation into config.
- **Quarterly architecture review.** Every quarter, the engineering lead reviews the gap between the platonic "reusable framework" and the actual state, and writes up findings. This is a 1-hour exercise, not a project. It surfaces the seams we are starting to leak.
- **Client #2 deployment is the test.** If client #2 takes more than 2 days of technical work, we stop and ask why. The "why" tells us where the seams need to harden before client #3.

**Residual risk.** Medium. This risk is structural and managed via discipline, not architecture.

---

## R7 — Conversion underperformance

**Likelihood:** M | **Impact:** H | **Score:** Medium

**Description.** The wizard is shipped, the site is live, but the conversion rate is below what the client expected. This becomes a commercial problem — the client questions the retainer.

**Mitigation.**
- **Analytics from day one.** GA4 + Clarity events on every step. We can see exactly where people abandon.
- **Baseline expectations documented.** The agency's pitch to the client must include realistic ranges (e.g. "expect 5–15% wizard completion on traffic that lands on the page; expect 30–50% of completers to become contacted leads"). Setting expectations is part of the commercial contract.
- **Iteration plan.** The retainer includes a monthly review where we look at the funnel, identify the largest abandonment, and propose one experiment. This makes the retainer a continuous-improvement engagement, not a maintenance one.
- **Conversion-focused defaults.** The wizard is designed with trust signals, fast first interaction, low cognitive load, and clear progress indication from day one. We don't ship a bad-conversion wizard and hope to fix it later.

**Residual risk.** Medium. We cannot guarantee conversion outcomes for the client, but we can structure the engagement so underperformance is a problem we solve together, not a problem the client points at us.

---

## R8 — Image storage growth on shared/Cloudways disk

**Likelihood:** M | **Impact:** L | **Score:** Low-Medium

**Description.** Compressed images average ~300–500KB. At 5 images per submission and 100 submissions/month, that's ~250MB/month, ~3GB/year per client. Over 3 years per client × 10 clients × a Cloudways droplet shared between several, disk fills up.

**Mitigation.**
- **Per-client droplets.** Each client has their own Cloudways environment. Their disk fills only with their data.
- **90-day pruning of submission records does not delete images automatically** — the images are in the WP media library and may have been referenced by the client manually. Document a separate quarterly housekeeping process to delete media older than 6 months that has no other references.
- **Offload option.** If a client reaches disk limits, the WP Offload Media plugin to S3 is a documented one-day migration.

**Residual risk.** Low.

---

## R9 — Spam and bot submissions

**Likelihood:** H | **Impact:** L | **Score:** Low-Medium

**Description.** The wizard endpoint is public. Bots will find it. Spam submissions waste Make.com operations, pollute HubSpot, and annoy the client.

**Mitigation.**
- **Honeypot field.** A hidden field that real users never fill; bots often do.
- **Time-to-submit check.** Submissions under 5 seconds flagged as suspicious.
- **Per-IP rate limit.** 3 submissions / 10 minutes per IP.
- **No reCAPTCHA in v1.** It adds friction for real users. We add it only if observed abuse warrants it.
- **Suspicious-flag in DB.** Suspect submissions are still stored but flagged; Make.com forwarding can be conditionally skipped for flagged ones (deferred — v1 forwards everything).

**Residual risk.** Low. If abuse becomes a problem, reCAPTCHA v3 is a 1-hour add.

---

## R10 — Single-engineer key-person risk

**Likelihood:** M | **Impact:** M | **Score:** Medium

**Description.** If the engineer who built this is unavailable for two weeks, can someone else maintain it?

**Mitigation.**
- **Documentation is a deliverable, not a side effect.** This very phase produces 6 docs. The operations runbook is a Phase 7 deliverable.
- **ADRs explain the "why."** A new engineer reading the code can answer "why is this like this?" by reading the relevant ADR.
- **Boring stack.** WordPress, React, TypeScript, Tailwind. Anyone with general web skills can be productive within a day.
- **No exotic libraries.** Every dependency has been chosen with a "would I want to onboard a new engineer to this?" filter.

**Residual risk.** Low-medium.

---

## R11 — Cloudways or DigitalOcean outage

**Likelihood:** L | **Impact:** H | **Score:** Low-Medium

**Description.** The platform is down; the client's site is down.

**Mitigation.**
- **This is the client's site, on a reputable host with their own SLAs.** We do not commit to better uptime than Cloudways commits to us.
- **Daily backups.** Restoration to a different region or host is possible if the outage is region-scoped.
- **Status communication.** The agency proactively communicates outage status to affected clients rather than them discovering it.

**Residual risk.** Low.

---

## R12 — The agency loses access to a client's Make.com / HubSpot account

**Likelihood:** L | **Impact:** H | **Score:** Low-Medium

**Description.** A client falls out with the agency, changes the Make.com password, and we cannot maintain their integration. Or worse, the client owner becomes unreachable and the agency cannot regain access.

**Mitigation.**
- **Accounts are owned by the client, not the agency.** The client's email is the primary on Make.com and HubSpot. The agency is invited as a team member.
- **This makes departure clean.** When a client leaves the agency, they keep their stuff. When the agency loses a client, the client doesn't lose their leads.
- **Documented offboarding.** The operations runbook covers what to do when an engagement ends: hand over the plugin license, document settings, remove agency access cleanly.

**Residual risk.** Low. This is a commercial design choice that doubles as a risk mitigation.

---

## Risks we are not mitigating

For honesty, the things we choose to live with:

- **Browser compatibility on truly old devices.** We test on iOS 15+ and Android 10+. Anything older is best-effort; if the wizard doesn't load, the page shows a phone number CTA fallback.
- **Truly malicious targeted attack.** The system has reasonable defences against drive-by abuse. A determined attacker who specifically wants to compromise one client's lead pipeline can find a way. The mitigation is monitoring and incident response, not impenetrability.
- **Make.com pricing changes.** They could 10x prices tomorrow. Migration to n8n or Zapier is a 1–2 day project per client; we have not pre-built it but the contract (webhook → routed actions) is portable.
- **WordPress core security CVEs.** Cloudways patches WordPress; we follow. We do not commit to faster-than-Cloudways patch latency.

---

## Top 3 risks to watch in the first 90 days post-launch

If we only watch three things in the first three months after going live:

1. **Submission count vs. Make.com execution count** — daily check. Catches both quota exhaustion and forwarder failures.
2. **Wizard completion rate** — weekly check in GA4. Catches conversion regression after any change.
3. **wp-admin error log + plugin update needed alerts** — weekly check. Catches PHP errors, plugin conflicts, and security patches needed.

These three checks should be a 15-minute weekly ritual for the agency. If they catch nothing for 6 months, we can think about reducing frequency.
