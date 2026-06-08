# ADR-0018: Wire Contract Changes Require Operational Verification

**Status:** Accepted
**Date:** 2026-06-08

## Context

The Quote Wizard system has a wire contract spanning PHP (server) and
TypeScript (client). The contract is documented in ADR-0015 and includes
PublicConfig shape, submission payload shape, response shape, and
contractVersion.

Across the project's history, three failures of this wire contract occurred
in production-deployed code while all CI gates were green:

1. **OV-001-F5** (Step 5.2): submission POST URL wrong (`/qw/v1` instead of
   `/qw/v1/submit`). Caught by manual OV-001 verification.
2. **5.5a wire contract drift** (discovered during Step 5.5a-remediation):
   the submission payload builder hardcoded `contractVersion: 2` even though
   PublicConfig schema was updated to `3`. The `quoteMode` field required by
   SubmissionController was never added to the wire payload. Every submission
   returned HTTP 400.
3. **Root cause**: unit tests assert within a layer; the wire contract spans
   layers; no integration-level test exercised the full pipeline from JS
   payload construction to PHP validation.

Each failure took multiple days of debugging to surface. Each surfaced the
same root issue: code-level gates are not sufficient to declare a step
complete when the wire contract changes.

## Decision

Wire contract changes now require operational verification as a blocking
acceptance criterion before the step is marked complete.

A step modifies the wire contract if it changes:

- PublicConfig shape (PHP emit or TS schema)
- Submission payload shape (TS construction or PHP validation)
- Response shape (PHP return or TS parsing)
- `contractVersion` value
- Any field name, type, or required-ness on any of the above

For any such step, two requirements are blocking:

**1. An integration test must exist** that exercises full payload construction
in TypeScript and asserts it matches the shape the PHP controller accepts. The
test must run in CI. The test file lives in
`apps/wizard/src/runtime/__tests__/wire-contract-integration.test.ts`.

**2. Operational verification must be performed** before the step is marked
complete. Deploy the changes to a real WordPress install, submit a wizard
end-to-end, observe the network response, observe the database row. The
verification entry in `phase-N-evidence.md` must use this exact language:

> "Submitted a wizard end-to-end on [site] on [date]. Observed HTTP [status]
> response. Confirmed database row [id] with [fields]."

Generic verification language ("redeployed and tested") is not sufficient.

## Consequences

### Positive

- Eliminates the failure mode that produced three multi-day debugging episodes.
- Forces the operational gap between CI and deployment to be explicit and
  verifiable.
- Provides a precise, falsifiable verification standard.

### Negative

- Adds operational overhead per wire-contract-affecting step.
- Operational verification requires a working LocalWP environment, which
  cannot be automated in CI.

### Risks

- Specs may attempt to skip the discipline by claiming a change doesn't affect
  the wire contract when it actually does. Mitigation: every spec must include
  a "wire contract impact" note in its pre-spec discipline checks.

## Alternatives considered

- **Integration test only, no operational verification requirement.** Rejected:
  integration tests can have their own gaps; operational verification catches
  what the tests don't.
- **Stricter type sharing between PHP and TypeScript (generated types).** Out
  of scope for this ADR; the integration test is the lightweight version.
  Heavier code generation is a possible future capability.

## Cross-references

- ADR-0015 (Submission Pipeline Architecture) — the wire contract this
  discipline protects
- ADR-0017 (Category Navigation and Manual-Quote) — the most recent change
  to the wire contract; the first enforcement target of this ADR
