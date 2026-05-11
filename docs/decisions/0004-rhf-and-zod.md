# ADR-0004: React Hook Form + Zod for form state and validation

**Status:** Accepted
**Date:** 2026-05-11

## Context

The quote wizard is a multi-step form. We need:

- Per-step validation (the user cannot proceed until the current step is valid).
- Whole-form validation at submission.
- Field-level error messages displayed inline.
- The same validation rules expressed in a single place — TypeScript types, runtime validation, and form validation should not drift.

## Decision

We use **React Hook Form** for form state and **Zod** for schema definition and validation, wired together via **`@hookform/resolvers`**.

## Alternatives considered

**Formik + Yup.**

- Pros: well-known, mature.
- Cons:
  - Formik re-renders the entire form tree on every keystroke by default; performance optimisation requires escape hatches. RHF uses uncontrolled inputs and is faster out of the box.
  - Yup's TypeScript inference is weaker than Zod's; the same schema does not double as a TypeScript type as cleanly.

**Vanilla React state (useState per field).**

- Pros: zero dependency.
- Cons:
  - We are reimplementing the same patterns (touched/dirty tracking, validation timing, error display) by hand. For a 7+ step wizard with ~15 fields, this is real code we would have to write and test.

**React Final Form.**

- Pros: another mature option.
- Cons: smaller ecosystem than RHF; less momentum; fewer third-party adapters.

**Zod alternatives (Yup, Joi, Valibot).**

- Yup: weaker TypeScript story than Zod.
- Joi: server-leaning, weak browser experience.
- Valibot: very promising, but smaller ecosystem and less stable than Zod. We will reconsider for v2.

## Consequences

**Easier:**

- A single Zod schema per step is the source of truth. TypeScript types are inferred from it. RHF validates from it. The WordPress endpoint can (in principle) consume a JSON-serialised version of the same shape.
- Per-step navigation is trivial: validate the current step's schema; if it passes, advance.
- Field errors display inline with minimal boilerplate.

**Harder:**

- Two libraries to learn (mitigated: both are short documents and the integration is one line).
- Bundle size: ~10KB gzipped for RHF, ~13KB for Zod. Acceptable per the performance budget in 02-architecture.md.

**To revisit:**

- If we ever build a server-side rendering path or need to share schemas with the PHP plugin literally, we would consider serialising Zod schemas to JSON Schema. This is possible but premature.
