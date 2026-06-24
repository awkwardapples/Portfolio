# Service Copy Audit — Step 5.9-Remediation

**Date:** 2026-06-22  
**Scope:** R5 — customer-friendly service copy  
**Files read:** All 11 `apps/wizard/src/domain/fixtures/*.config.ts`

---

## Wizard title inventory

The `WizardConfig.title` field is used for identification and will appear in SEO contexts (Step 5.10). All current titles carry developer-flavored suffixes ("quote", "quote request").

| Service           | Current title                     | Proposed title            | Change needed           |
| ----------------- | --------------------------------- | ------------------------- | ----------------------- |
| `fencing`         | `'Fencing quote'`                 | `'Fencing'`               | Remove " quote"         |
| `decking`         | `'Decking quote'`                 | `'Decking'`               | Remove " quote"         |
| `painting`        | `'Painting & decorating quote'`   | `'Painting & decorating'` | Remove " quote"         |
| `patio`           | `'Patio & paving quote'`          | `'Patio & paving'`        | Remove " quote"         |
| `driveway`        | `'Driveway quote'`                | `'Driveway'`              | Remove " quote"         |
| `steps`           | `'Garden steps quote'`            | `'Garden steps'`          | Remove " quote"         |
| `jetwash`         | `'Pressure washing quote'`        | `'Pressure washing'`      | Remove " quote"         |
| `general-repairs` | `'General repairs quote request'` | `'General repairs'`       | Remove " quote request" |
| `plumbing`        | `'Plumbing quote request'`        | `'Plumbing'`              | Remove " quote request" |
| `electrical`      | `'Electrical work quote request'` | `'Electrical work'`       | Remove " quote request" |
| `carpentry`       | `'Carpentry quote request'`       | `'Carpentry'`             | Remove " quote request" |

---

## Step title inventory

Step titles (shown in the StepCard heading) reviewed across all 11 configs.

**Verdict: No changes needed.** All step titles are customer-appropriate:

- "Your fence", "Your deck", "Rooms", "Steps design" — service-specific, clear
- "Extras", "Photos", "Your details", "Review" — generic, appropriate
- "Describe the work", "Urgency", "Property type", "Contact preference" — professional
- "Your address" — plain language

---

## Field label inventory

Field labels reviewed across all 11 configs.

**Verdict: No changes needed.** Labels are consistent and customer-friendly:

- "Approximate length in metres" — "A rough estimate is fine." ✓
- "Number of rooms", "Area to clean (m²)" — clear ✓
- "How soon do you need this?" with options including "I'm flexible" ✓
- "Preferred contact method" ✓

---

## Help text inventory

Help text is brief and appropriate:

- "Up to 5 photos. We accept JPEG, PNG, and WebP." ✓
- "Count each bedroom, living room, kitchen, and bathroom as one room each." ✓
- "The more detail you give, the more accurate our quote will be." ✓

---

## Canonical config location — Audit C result

**File:** `plugins/quote-wizard/src/Frontend/PublicConfig.php`  
**Line:** `$config['enableCategoryNavigation'] = (bool) get_option( 'goqw_enable_category_navigation', false );`

The `enableCategoryNavigation` flag is controlled by WordPress option `goqw_enable_category_navigation`. The PHP default is `false`. For R1, change the PHP default to `true` so fresh canonical installations show services grouped by category.

**JS architectural default** (`config-loader.ts` `DEFAULT_CONFIG`) remains `false` — used only in non-WordPress dev mode.

---

## Summary of changes required (R5)

11 files, one-line change each (wizard `title` field only). No step titles, labels, help text, or other copy changes needed.
