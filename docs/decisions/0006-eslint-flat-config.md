# ADR-0006: ESLint flat config and minimal-friction rule set

**Status:** Accepted
**Date:** 2026-05-11

## Context

We need a linter for the React/TypeScript wizard. The choices involved are:

1. ESLint configuration format: the legacy `.eslintrc` or the v9 "flat config".
2. Rule selection philosophy: enable a heavy preset (e.g. `airbnb`, `standard`) or curate a minimal set.
3. How strict to be at the commit boundary.

The constraint from the project owner: rules should optimise for **operational correctness** (async safety, React rules of hooks, type safety) and avoid **lint theatre** (stylistic rules already handled by Prettier, opinionated naming conventions, complexity ceilings).

## Decision

We use **ESLint v9 with flat config** (`eslint.config.js`) and a **minimal, deliberately-curated rule set**, configured at the workspace level in `apps/wizard/eslint.config.js`.

We **block commits on ESLint warnings** via `--max-warnings=0` in `lint-staged`. Warnings that need to ship are explicitly silenced with a justifying comment, not allowed to accumulate.

## Rule selection summary

**Enabled and high-value (the reason this linter exists at all):**

- `@typescript-eslint/no-floating-promises` — catches dropped async work. In a lead-submission flow, a floating promise is a lost lead.
- `@typescript-eslint/no-misused-promises` — catches async functions used where sync are expected (`onClick={asyncFn}` etc.).
- `@typescript-eslint/await-thenable` — catches `await` on non-promise values.
- `react-hooks/rules-of-hooks` — calling hooks conditionally produces real runtime bugs.
- `react-hooks/exhaustive-deps` (warn) — missing `useEffect` deps cause subtle staleness bugs.
- `react/jsx-key` — missing keys cause render bugs.
- `react/jsx-no-target-blank` — tabnabbing prevention.
- `eqeqeq` — `==` vs `===` confusion is universal.
- `no-debugger` — `debugger` statements should never ship.
- `no-console` (warn, allow warn/error) — `console.log` should not ship.

**Enabled and accepted (jsx-a11y/recommended):**

- Standard accessibility rules for JSX. Cheap and real users benefit.

**Disabled deliberately:**

- `react/react-in-jsx-scope` — not needed with the modern JSX transform.
- `react/prop-types` — pointless in TypeScript.
- `react/no-unescaped-entities` — friction over apostrophes; browser handles it.
- `@typescript-eslint/no-non-null-assertion` — `value!` is sometimes the cleanest expression of "I just checked".
- `@typescript-eslint/no-empty-function` — empty functions are often intentional.

**Not installed (considered and rejected):**

- `eslint-plugin-import` — slow, and `tsc --noEmit` already catches broken imports.
- `eslint-config-prettier` — no overlap with Prettier in our rule set.
- `eslint-plugin-unicorn` — high noise-to-signal.
- Naming-convention rules — pure friction.
- Complexity / line-count limits — premature optimisation.

## Alternatives considered

**Heavy preset (`airbnb`, `standard`).**

- Pros: comprehensive, "decided for you".
- Cons: hundreds of rules, many stylistic and irrelevant to our context. Onboarding tax. Friction during rapid iteration. The cure is worse than the disease for a small codebase with a small team.

**Legacy `.eslintrc` config.**

- Pros: more examples online.
- Cons: deprecated in ESLint v9. No reason to start a greenfield project on the deprecated format.

**Block only on errors (allow warnings to accumulate).**

- Pros: less commit friction.
- Cons: warnings become invisible; the codebase accrues unaddressed warnings over months. The `no-explicit-any` and `exhaustive-deps` warnings specifically — the ones we'd most want to read — would be the first lost.

## Consequences

**Easier:**

- Lint runs catch real bugs without producing noise.
- New engineers can read the entire rule set in 60 seconds.
- No fighting the linter over stylistic preferences.
- Async correctness is enforced — the highest-value class of bug in this codebase.

**Harder:**

- Type-aware linting (the `recommendedTypeChecked` preset) is slower than non-type-aware linting because it requires resolving the TypeScript program. On the current codebase this is ~1 second; will grow with the code. Acceptable.
- `--max-warnings=0` at commit time forces a moment of decision for every warning. This is a feature, not a bug — but it adds friction. A `git commit --no-verify` escape hatch exists for WIP commits.

**To revisit:**

- If we later add a backend Node service or a shared types package, we'll need a second ESLint config or a root-level one. Defer until that exists.
- If specific rules prove to cost more than they save in practice, we'll disable them and document the reason in a follow-up ADR.
