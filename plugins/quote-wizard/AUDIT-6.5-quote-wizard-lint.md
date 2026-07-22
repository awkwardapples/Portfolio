# Audit 6.5-A: quote-wizard.php PHPCS Violations

_Compiled: 2026-07-22_

## Command run

```
cd plugins/quote-wizard
composer lint
```

(The spec's suggested `composer lint quote-wizard.php` doesn't work as
written — the `lint` composer script invokes PHPCS over the configured
path set in `phpcs.xml`/`composer.json`, not an arbitrary file argument
passed through Composer; `composer lint` scans the whole plugin and
`quote-wizard.php` is one of the 46 files it checks. To isolate just this
file directly: `vendor/bin/phpcs quote-wizard.php`.)

## Original violations (before any fix)

```
FILE: plugins/quote-wizard/quote-wizard.php
FOUND 2 ERRORS AND 2 WARNINGS AFFECTING 4 LINES
--------------------------------------------------------------------------------
 14 | ERROR   | [ ] There must be exactly one blank line after the file comment
    |         |     (Squiz.Commenting.FileComment.SpacingAfterComment)
 39 | WARNING | [x] Equals sign not aligned with surrounding assignments;
    |         |     expected 2 spaces but found 1 space
    |         |     (Generic.Formatting.MultipleStatementAlignment.NotSameWarning)
 40 | WARNING | [x] Equals sign not aligned with surrounding assignments;
    |         |     expected 11 spaces but found 1 space
    |         |     (Generic.Formatting.MultipleStatementAlignment.NotSameWarning)
 61 | ERROR   | [x] Expected 1 newline at end of file; 0 found
    |         |     (PSR2.Files.EndFileNewline.NoneFound)
--------------------------------------------------------------------------------
PHPCBF CAN FIX THE 3 MARKED SNIFF VIOLATIONS AUTOMATICALLY
```

## Per-violation detail

| Line | Rule                                                           | Nature                                                                                                                                                                                                                                                                                                                                                                                                                                    | Autofixable?                                                                                                  |
| ---- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 14   | `Squiz.Commenting.FileComment.SpacingAfterComment`             | The file docblock (lines 2–14, the standard WordPress plugin header) is immediately followed by `declare( strict_types=1 );` on line 15 with no blank line between the closing `*/` and the statement. WordPress/Squiz coding standard requires exactly one blank line there.                                                                                                                                                             | **No** — not marked `[x]`; PHPCBF doesn't touch this sniff's violations, must be a manual one-line insertion. |
| 39   | `Generic.Formatting.MultipleStatementAlignment.NotSameWarning` | Three consecutive `$var = expr;` assignments (lines 38–40, inside the PSR-4 autoloader closure) should have their `=` signs vertically aligned to the longest variable name (`$relative_class`, 15 chars) per this codebase's alignment convention (same style already used elsewhere, e.g. the `array{name, description, category}` PHPDoc blocks). Line 39's `$relative_path` (14 chars) had only 1 space before `=`; needs 2 to align. | **Yes** (`[x]`)                                                                                               |
| 40   | Same rule                                                      | Line 40's `$file` (5 chars) had only 1 space before `=`; needs 11 to align with the same 15-char reference.                                                                                                                                                                                                                                                                                                                               | **Yes** (`[x]`)                                                                                               |
| 61   | `PSR2.Files.EndFileNewline.NoneFound`                          | The file's last line (`);`, closing the `add_action` call) had no trailing newline character.                                                                                                                                                                                                                                                                                                                                             | **Yes** (`[x]`)                                                                                               |

## Root cause

**Not a single root cause — three independent, unrelated drift sources,
each a one-off manual-editing artifact:**

1. The file-comment spacing violation is old: `quote-wizard.php` is the
   plugin bootstrap file, edited only a handful of times across the whole
   project (constants, autoloader, activation hooks) — whoever last
   touched the header comment block simply didn't leave a blank line
   after it, and no `composer lint` run ever gated a commit that touched
   only this file until now (the plugin's own tests/CI process gates PHP
   changes generally, but this specific "did line 14 have a blank line"
   detail apparently was never the failing line in a blocking way,
   consistent with the recurring cross-step note "pre-existing, unrelated
   drift in `quote-wizard.php` predates 5.13e/5.13f/..." threaded through
   `docs/current-state.md` since at least Step 5.13e).
2. The two alignment warnings (lines 39–40) are a classic "added a
   shorter/longer variable name to an existing aligned block without
   re-aligning the others" drift — whoever last edited the autoloader
   closure's three assignment lines changed one variable's name length
   without adjusting the other two lines' padding.
3. The missing trailing newline is a common editor/save artifact (some
   editors don't append a final newline unless explicitly configured to).

None of the three relate to any functional behavior — all are pure
formatting/whitespace sniffs. Fixing them has zero runtime effect.

## Verification after fix

```
vendor/bin/phpcbf quote-wizard.php   # fixes lines 39, 40, 61 automatically
```

then manually insert one blank line between line 14 (`*/`) and the
`declare( strict_types=1 );` statement, then:

```
composer lint
```

must report 0 errors, 0 warnings across all 46 files (not just this one).
