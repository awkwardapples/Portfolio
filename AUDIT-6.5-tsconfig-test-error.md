# Audit 6.5-C: tsconfig.test.json Error

_Compiled: 2026-07-22_

## Location

```
apps/wizard/tsconfig.test.json
```

Only one file by this name in the repo (confirmed via `find . -iname
"tsconfig.test.json" -not -path "*/node_modules/*"`).

## Critical finding: there is no configuration error in tsconfig.test.json itself

**The spec's framing of this as a third, independent issue — distinct
from Audit B's `non-field-step-engine.test.ts` errors — is not
accurate.** Reading the file:

```jsonc
{
  // Test files legitimately index into known fixture structures. We keep the
  // production code under noUncheckedIndexedAccess (strict), but relax it for
  // tests. The `include` was extended in Step 4.5 to cover src/types/*.d.ts
  // so config-loader tests can see the ambient window.GOQW_CONFIG declaration.
  // See ADR-0009 amendment (wizardId / contractVersion v2).
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noUncheckedIndexedAccess": false,
  },
  "include": ["src/**/*.test.ts", "src/types/*.d.ts"],
  "exclude": ["node_modules", "dist"],
}
```

This is a small, well-documented, correctly-formed config: it extends the
production `tsconfig.json`, deliberately relaxes one strict check for
test ergonomics (with a clear comment explaining why, and a reference to
the step and ADR that introduced the relaxation), and includes exactly
what it should — every `.test.ts` file plus the ambient type declarations
tests need. **There is no missing `include`, no wrong `reference`, no
deprecated setting, and no build-script issue.** It does exactly what its
own comment says it does.

## Why it "shows an error" anyway

Production `tsconfig.json` (`apps/wizard/tsconfig.json:60`) explicitly
excludes test files: `"exclude": ["node_modules", "dist",
"src/**/*.test.ts"]`. So `pnpm typecheck`'s first command (`tsc --noEmit`,
against the production config) **never type-checks any `.test.ts` file at
all** — by design, since production type-checking shouldn't depend on
test-only code. `tsconfig.test.json` is the _only_ config that type-checks
`non-field-step-engine.test.ts`, which is exactly why the two errors
documented in `AUDIT-6.5-nfs-engine-errors.md` only surface when running
against _this_ config, and not when running the plain production
`tsc --noEmit`.

## Conclusion: this is the same one issue as Audit B, not a separate root cause

**The spec's Audit A/B/C structure treats "non-field-step-engine.test.ts
type errors" and "tsconfig.test.json error" as two of the three items to
fix independently. They are one issue, observed from two angles:**

- Audit B asks "what's wrong with this test file" → answer: two missing
  fields in one fixture object (Section "Root cause" in
  `AUDIT-6.5-nfs-engine-errors.md`).
- Audit C asks "what's wrong with this config" → answer: nothing: the
  config correctly surfaces a real error that exists in a file it's
  supposed to check.

This matches the exact wording that's been carried in
`docs/current-state.md`'s gate-state notes since at least Step 5.13a/
5.13b: "pre-existing, unrelated `tsconfig.test.json` type errors in
`non-field-step-engine.test.ts`" — a single compound phrase describing
one thing, not two. Fixing `AUDIT-6.5-nfs-engine-errors.md`'s two missing
fields is **the entire fix** for both spec items 2 and 3; no separate
edit to `tsconfig.test.json` is needed or would make sense (there is
nothing incorrect in it to change).

## Verification after fix

```
cd apps/wizard
pnpm typecheck   # tsc --noEmit (production) && tsc --noEmit -p tsconfig.test.json (test) — both must exit 0
```
