# ADR-0040: Hosting on Cloudflare Workers static assets, D1 and Turnstile; deploy through GitHub Actions

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 1)

## Context

The portfolio is static apart from one API route (the contact wizard's submission). The spec asks for free hosting with the domain as the only cost (spec D, U.5), durable storage for enquiries, bot protection, and no server to maintain.

## Decision

- **One Worker, `joshlennon-site` (`apps/edge`), with static assets.** The asset handler serves `apps/site/dist` without running Worker code; only `/api/*` runs the Worker first (`run_worker_first: ["/api/*"]`). Unknown paths get the real `404.html` with a 404 status (`not_found_handling: "404-page"`), and `/page.html` is served at `/page` (`html_handling: "drop-trailing-slash"`). Every key was checked against Wrangler 4.147's configuration schema.
- **D1 for submissions and rate-limit counters**, schema in `apps/edge/migrations/`. `wrangler.jsonc` names the database (`joshlennon-site`) but carries no ID: the deploy workflow creates the database in Western Europe on the first deploy, and Wrangler finds it by name after that, so no ID has to be copied into the repository.
- **Turnstile** guards the submission (Pass 6), with Cloudflare's test keys in development.
- **Security headers** for static files come from `apps/site/public/_headers`; API responses set their own in the Worker. The Content Security Policy is added in Pass 9.
- **Deploys run in GitHub Actions.** `.github/workflows/deploy.yml` runs on every push to `main`, daily (to refresh the GitHub snapshot, spec M.1) and on demand. It builds everything, creates the D1 database if it is missing, applies migrations, then deploys with `cloudflare/wrangler-action`. A preflight job checks the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets; if either is missing, the deploy job is skipped with a notice in the run summary instead of failing, so merging to `main` never goes red before Cloudflare is set up.
- Until the custom domain is attached (Pass 10), the site is served on its `workers.dev` URL. Canonical URLs already point at `https://joshlennon.com` (spec U.8), so the preview host is not indexed as the canonical copy.

## Alternatives considered

- **Cloudflare Pages.** Rejected: Cloudflare steers new projects to Workers with static assets, which also gives cron triggers for forward retries and pruning (spec D).
- **Netlify or Vercel.** Rejected: free tiers meter function invocations and bandwidth differently, have no equivalent of D1 alongside the functions, and Turnstile and Email Routing are on Cloudflare anyway.
- **Committing the D1 database ID.** Not needed: Wrangler 4 looks databases up by name, and creating the database in the workflow removes a manual step.

## Consequences

- Static requests are free and unmetered; only `/api/*` counts against the Workers free tier.
- Josh's one-time set-up (Cloudflare account and API token, repository secrets, Worker secrets for Pass 6, the domain in Pass 10) is listed step by step in [`docs/deployment.md`](../deployment.md).
- Cron triggers (forward retries every 15 minutes, daily pruning) are added with the code that handles them in Pass 6, because a configured cron without a `scheduled` handler would error.
