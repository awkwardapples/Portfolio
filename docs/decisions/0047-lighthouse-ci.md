# ADR-0047: Performance budgets checked by Lighthouse CI, run as a GitHub Action

**Status:** Accepted
**Date:** 2026-10-04 (Portfolio Pass 4)

## Context

Pass 4's acceptance requires the homepage's Largest Contentful Paint and Cumulative Layout Shift to be within the spec P.1 budgets in Lighthouse CI (2.0 s or less on a simulated mid-range phone, 0.05 or less). Pass 9 extends this to a work page, `/music` and `/contact`, and adds the other budgets. Lighthouse CI is not on the approved dependency list (spec U.6), which asks for a justification in an ADR for anything else.

## Decision

Lighthouse CI runs in `ci.yml` through the `treosh/lighthouse-ci-action@v12` action, configured by `lighthouserc.json` at the repository root. It serves `apps/site/dist` with its own static server, runs Lighthouse three times with the default mobile emulation and simulated throttling, and asserts the median run against the budgets. Reports are uploaded as a workflow artifact; nothing goes to public temporary storage.

Nothing is added to `package.json`: the action brings its own Lighthouse and Chrome on the CI runner, so the workspace's dependency tree, lockfile and local install are unchanged.

## Alternatives considered

- **`@lhci/cli` as a dev dependency.** Rejected: a large dependency tree (it bundles Lighthouse and Puppeteer) for something that only runs in CI.
- **Measuring with Playwright's performance APIs.** Rejected: real-browser timings on a CI runner vary widely, while Lighthouse's simulated throttling is the measure spec P.1 names.

## Consequences

- The budgets are checked against the static build without the Worker's headers. Headers do not affect LCP or CLS; caching and the Content Security Policy are checked separately in Pass 9.
- Running Lighthouse locally is optional and needs `npx @lhci/cli autorun` with Chrome installed.
- Pass 9 adds URLs and assertions to `lighthouserc.json`; the workflow step does not change.
