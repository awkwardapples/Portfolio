# Contributing

The rules for working on this codebase. If a rule seems wrong for a situation, change it with an ADR rather than ignoring it.

The governing document is [`docs/portfolio-spec.md`](docs/portfolio-spec.md). Where it and older documents disagree, the code is the source of truth, then the spec, then ADRs 0039 onwards.

---

## Branches and pull requests

The transformation (spec section V, Passes 0 to 10) happened on `portfolio-transformation` and is complete. From now on:

- Short-lived branches (`feat/`, `fix/`, `chore/`, `docs/`) target `main` through a pull request and merge once CI is green.
- Merging to `main` deploys (see [`docs/deployment.md`](docs/deployment.md)).
- Never push from a clone made before the Pass 0 history rewrite (3 October 2026); re-clone instead.

Every pull request description answers: what changed, why, how it was verified, and which ADRs it relates to (the template in `.github/PULL_REQUEST_TEMPLATE.md` has the sections).

## Commits

[Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative description>

[optional body explaining the why]
```

| Type       | Use                                                 |
| ---------- | --------------------------------------------------- |
| `feat`     | A new capability for visitors or for Josh as author |
| `fix`      | A bug fix                                           |
| `chore`    | Tooling, build, dependency or non-visible clean-up  |
| `docs`     | Documentation only                                  |
| `refactor` | Internal restructuring with no behaviour change     |
| `test`     | Adding or improving tests                           |
| `perf`     | A measurable performance change                     |
| `style`    | Formatting only                                     |

Scopes in use: `site`, `edge`, `wizard`, `content`, `ci`, `repo`, `security`, `deps`. Keep the subject under 72 characters and in the imperative mood ("add", not "added").

## Gates

Before pushing, run `pnpm gates` (or the individual commands listed in the [README](README.md#gates)). The pre-commit hook runs ESLint and Prettier on staged files. A pass never starts with a red gate.

## Architecture decision records

ADRs live in `docs/decisions/`, indexed in its [README](docs/decisions/README.md). Write one, within a day of the decision, when you:

- add a dependency that changes the stack;
- choose between two non-trivial implementation paths;
- depart from an earlier decision;
- introduce a pattern that should be applied consistently.

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

What does this make easier or harder? What might we revisit?
```

## Code style

- TypeScript, JavaScript, CSS, JSON, YAML and Markdown are formatted by Prettier (`.prettierrc`). `pnpm format` fixes formatting. `.astro` files are not formatted by Prettier (that needs a plugin outside the approved dependencies).
- Text files use LF line endings everywhere (`.gitattributes`).
- The design rules are enforced, not suggested: no gradients, blur, spinners, raw hex colours outside the token definitions, Tailwind arbitrary values, marketing words or emoji. ESLint checks TypeScript and React files; `scripts/check-design.mjs` checks `.astro`, CSS and Markdown.
- The site's own code imports with `~/`; `@/` always means `apps/wizard/src`.

## Adding a dependency

The approved dependencies are listed in spec section U.6. Anything else needs a reason recorded in the relevant ADR before it is added, covering:

1. What problem it solves that the standard library or existing code cannot, in a reasonable amount of code.
2. Its weight (kB gzipped for anything shipped to browsers).
3. Who maintains it and how active it is.
4. Its licence.
5. How it would be removed if it stopped being maintained.

## Content and secrets

- Never write facts about Josh that are not in the spec or in content he supplied; use `TODO(josh): what is needed` placeholders (spec T.4).
- Never commit secrets, webhook URLs, personal contact details or real enquiry data. Worker secrets are set with `wrangler secret put`; CI secrets live in the repository settings.
