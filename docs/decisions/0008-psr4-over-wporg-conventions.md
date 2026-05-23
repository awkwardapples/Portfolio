# ADR-0008: PSR-4 over wordpress.org plugin directory conventions

**Status:** Accepted
**Date:** 2026-05-13

## Context

The first run of PHPCS against the Step 3D plugin scaffold reported dozens of errors of two kinds:

1. **Filename convention errors** — `WordPress.Files.FileName.NotHyphenatedLowercase` and `WordPress.Files.FileName.InvalidClassFileName` flagged every PSR-4 file (`Schema.php`, `Activator.php`, etc.) for not being named `class-schema.php`, `class-activator.php`, etc.
2. **Short prefix warning** — `WordPress.NamingConventions.PrefixAllGlobals.ShortPrefixPassed` flagged the agreed `qw_` / `QW_` prefix for being under 4 characters.

These rules originate from the WordPress.org plugin directory's **submission guidelines** — the rules a plugin must follow to be accepted into wordpress.org's official plugin repository. They predate Composer/PSR-4 era WordPress development.

We must decide whether to:

- **A.** Comply with the wordpress.org rules: rename every file to `class-*.php` and lengthen the prefix. This regresses the architecture from PSR-4 to procedural-WordPress conventions.
- **B.** Exclude the rules, keep PSR-4, document the decision.

## Decision

We choose **B**. The plugin remains PSR-4 with PascalCase filenames. The wordpress.org-specific WPCS rules are excluded with documented per-rule reasons in `phpcs.xml.dist`. The prefix is migrated to `goqw_` / `GOQW_` (4+ characters) for operational distinctiveness, not because the WPCS rule demanded it.

The codebase is **standards-driven, not standards-submissive**: we adopt rules that improve correctness, security, and maintainability; we exclude rules whose only function is conformance to a distribution channel we do not target.

## Alternatives considered

**A1. Comply fully: rename every file to `class-foo.php`.**

- Pros: PHPCS passes out of the box. Familiar to engineers from the procedural-WordPress era.
- Cons:
  - **Breaks PSR-4 autoloading**, which requires filename to match class name. We would have to write a custom autoloader to map `class-schema.php` to `Agency\QuoteWizard\Submissions\Schema`. That custom autoloader is now a maintenance liability and a deviation from the universal PHP standard.
  - **Inconsistent with every modern WordPress plugin** of comparable scope: WooCommerce, Yoast SEO, Easy Digital Downloads, MailPoet, and others all use PSR-4 + PascalCase filenames and exclude these WPCS rules.
  - **Loses IDE navigation**. Jump-to-definition relies on PSR-4 conventions; class-prefixed filenames break it.
  - **Documentation rewrite required** — Phase 1's `03-project-structure.md` explicitly lists `Schema.php`, `Activator.php`, etc. as the canonical layout.

**A2. Don't run PHPCS at all.**

- Pros: no rule conflicts.
- Cons: we lose the WPCS rules that ARE valuable (sanitisation, escaping, nonce, capability, prepared SQL, i18n). The bath water has the baby in it.

**B. Exclude wordpress.org-marketplace rules, keep everything else.** (chosen)

- Pros: Modern architecture preserved. Real safety rules still enforced. New engineers find the codebase looks like the rest of the modern PHP world.
- Cons: We maintain a small list of excluded rules in `phpcs.xml.dist`. Each exclusion is documented inline.

## Rules excluded (with per-rule rationale)

| Rule                                                             | Reason                                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `WordPress.Files.FileName.NotHyphenatedLowercase`                | We use PSR-4. Filenames must match class names.                                                                             |
| `WordPress.Files.FileName.InvalidClassFileName`                  | Same — `class-*.php` is procedural-era.                                                                                     |
| `WordPress.NamingConventions.PrefixAllGlobals.ShortPrefixPassed` | Belt-and-braces in case a sub-package needs a shorter prefix for a justified reason; the chosen `goqw_` is already 4 chars. |
| `WordPress.PHP.YodaConditions.NotYoda`                           | Stylistic, not a correctness rule. Strict types make the original footgun a non-issue.                                      |
| `Squiz.Commenting.FileComment.Missing`                           | Class-level PHPDoc is more useful than duplicated file headers.                                                             |
| `Squiz.Commenting.FileComment.MissingPackageTag`                 | Same.                                                                                                                       |

Every other WPCS rule remains active.

## Prefix decision

The plugin previously used `qw_` / `QW_`. As part of this remediation, every global identifier was renamed to `goqw_` / `GOQW_`:

- **Distinctiveness.** A 4-character prefix is comfortably above the WPCS-recommended 3-char floor. While we exclude the WPCS rule that enforces this, the underlying rationale (collision avoidance) is still valid.
- **Agency-generic.** "Growth Ops Quote Wizard" — not tied to the first client. The codebase is intended to be redeployed across multiple clients and trade verticals.
- **Single mass rename.** Better to do it now while the surface is small (~60 occurrences) than after the system has accumulated more global identifiers.

Operational naming standards (committed alongside this ADR):

| Surface                   | Pattern                                             |
| ------------------------- | --------------------------------------------------- |
| DB tables                 | `wp_goqw_<plural>`                                  |
| `wp_options` keys         | `goqw_<snake_case>`                                 |
| wp-config.php constants   | `GOQW_<UPPER_SNAKE>`                                |
| Plugin internal constants | `GOQW_<UPPER_SNAKE>`                                |
| Cron hooks                | `goqw_<snake_case>`                                 |
| Transient keys            | `goqw_<snake_case>`                                 |
| REST namespace            | `qw/v1` — short by design (cross-language contract) |
| Shortcode                 | `[quote_wizard]` — user-facing, unchanged           |
| React mount ID            | `qw-root` — private React/PHP contract              |

## Consequences

**Easier:**

- The codebase looks like every modern PHP project. New engineers — and future-us — are not surprised.
- PSR-4 autoloading remains zero-configuration: filename matches class name, period.
- IDE tooling (jump-to-definition, refactor-rename) works without special configuration.
- The intent of "private agency platform" is now explicit in the code conventions, not assumed.

**Harder:**

- We carry an explicit list of WPCS exclusions in `phpcs.xml.dist`. Each exclusion has a documented reason; adding a new one should require an ADR update.
- A future engineer who has only seen procedural-WordPress plugins may be confused by the modern conventions. The plugin `README.md` and this ADR explain the rationale.

**To revisit:**

- If we ever genuinely consider distributing via wordpress.org (we won't, but if), this ADR is the first thing to re-open.
- If new WPCS rules ship in future major versions that overlap with our excluded set, we audit them and update `phpcs.xml.dist` deliberately.
