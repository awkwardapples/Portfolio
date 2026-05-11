# Contributing

This document is the rulebook for working on this codebase. It exists so that the conventions agreed in Phase 1 survive engineer turnover.

If a rule below seems wrong for a specific situation, raise it in an ADR rather than ignoring it silently.

---

## 1. Branching

| Branch               | Purpose                                                         | Lifecycle                         |
| -------------------- | --------------------------------------------------------------- | --------------------------------- |
| `main`               | Production-ready. Tagged releases come from here.               | Protected. No direct pushes.      |
| `feat/<short-name>`  | A new feature or capability.                                    | Short-lived. Deleted after merge. |
| `fix/<short-name>`   | A bug fix.                                                      | Short-lived. Deleted after merge. |
| `chore/<short-name>` | Tooling, deps, refactors with no user-visible behaviour change. | Short-lived.                      |
| `docs/<short-name>`  | Documentation-only changes.                                     | Short-lived.                      |

We do **not** use a `develop` branch. PRs target `main` directly. If a change is too big to land in `main` within a week, hide it behind a feature flag or break it into smaller PRs.

---

## 2. Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/) so that release notes and changelogs are mechanically generatable.

Format:

```
<type>(<scope>): <short imperative description>

[optional body explaining the why]

[optional footer: BREAKING CHANGE, refs to ADRs, etc.]
```

Allowed types:

| Type       | Use                                                               |
| ---------- | ----------------------------------------------------------------- |
| `feat`     | A new capability for users (homeowner-facing or operator-facing). |
| `fix`      | A bug fix.                                                        |
| `chore`    | Tooling, build, dependency, or non-user-visible cleanup.          |
| `docs`     | Documentation only.                                               |
| `refactor` | Internal restructuring with no behaviour change.                  |
| `test`     | Adding or improving tests.                                        |
| `perf`     | A measurable performance change.                                  |

Examples:

```
feat(wizard): add photo upload step with client-side compression
fix(plugin): handle missing WP nonce with 403 instead of 500
chore(deps): bump zod to 3.23.0
docs(architecture): clarify forwarder error contract
refactor(engine): extract rule evaluator into separate file
```

Keep the subject line under 72 characters and in the imperative mood ("add", not "added" or "adds").

---

## 3. Pull requests

### Before opening a PR

- Rebase onto the latest `main`.
- Run `pnpm format` and ensure CI checks pass locally where possible.
- Update or add relevant documentation in the same PR.
- If the change is non-trivially architectural, write an ADR in `docs/decisions/`.

### PR description

The pull request template in `.github/PULL_REQUEST_TEMPLATE.md` defines the required structure. At minimum, every PR description must answer:

1. **What changed?** A short summary.
2. **Why?** The motivation — what problem this solves, or what capability it adds.
3. **How was it verified?** Manual steps, screenshots, or test references.
4. **Related ADRs / issues?** Links to relevant decision records or tickets.

### Review and merge

- At least one approving review is required (where the team is larger than one). Solo work still goes through a PR for the audit trail.
- All CI checks must be green.
- We squash-merge by default. Keep the squashed commit message conventional.
- Delete the branch after merge.

---

## 4. Architecture Decision Records (ADRs)

ADRs live in `docs/decisions/` and capture significant decisions with their context, alternatives, and consequences.

When to write one:

- Introducing a new dependency that materially changes the stack.
- Choosing between two non-trivial implementation paths.
- Departing from a previously-recorded decision.
- Adding a new pattern that should be applied consistently elsewhere.

When **not** to write one:

- Small bug fixes.
- Refactors with no architectural implication.
- Anything that's a re-application of an existing pattern.

ADRs are short (one page). Late ADRs lie because they rationalise; same-day ADRs tell the truth about the tradeoff. Write them within 24 hours of the decision being made.

Template:

```markdown
# ADR-NNNN: Title

**Status:** Proposed | Accepted | Superseded by ADR-XXXX
**Date:** YYYY-MM-DD

## Context

What is the problem? What forces are at play?

## Decision

What did we decide? Be specific.

## Alternatives considered

What else was on the table? Why was it rejected?

## Consequences

What does this make easier? What does this make harder?
What might we have to revisit?
```

---

## 5. Tags and releases

Plugin versions follow [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- `v0.x.x` while pre-production
- `v1.0.0` is "first client live in production"

Phase milestone tags:

| Tag                   | Marks          |
| --------------------- | -------------- |
| `v0.1.0-scaffold`     | End of Phase 3 |
| `v0.2.0-engine`       | End of Phase 4 |
| `v0.3.0-integrations` | End of Phase 5 |
| `v1.0.0-rc1`          | End of Phase 6 |
| `v1.0.0`              | End of Phase 7 |

The plugin version in `plugins/quote-wizard/quote-wizard.php` (the plugin header) is the single source of truth. Tags must match it.

---

## 6. Code style

- TypeScript/JavaScript/CSS/Markdown: formatted by Prettier. Configuration in `.prettierrc`. Run `pnpm format` before pushing.
- PHP: WordPress Coding Standards via PHPCS. Configuration arrives in step 3D.
- File and directory naming: see `docs/03-project-structure.md` §8.

---

## 7. Adding a dependency

Every new dependency needs a justification. Before running `pnpm add` or `composer require`, answer in the PR description:

1. What problem does it solve that we cannot solve with the standard library in a reasonable amount of code?
2. What is its weight (KB gzipped for runtime; install time for dev)?
3. Who maintains it? How active is it? Last commit?
4. What is the licence?
5. What is the rollback story if it becomes unmaintained?

This is not bureaucracy — it is the difference between a codebase that stays maintainable and one that drowns in supply-chain weight.
