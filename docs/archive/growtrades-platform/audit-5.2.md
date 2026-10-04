# Audit 5.2 — Post-Step-5.1 Verification

_Compiled: 2026-06-03_

**Summary:** 7 gates verified green / 0 gates failed / 4 findings recorded across 4 sections.
All findings are MINOR; none are blocking. The implementation is architecturally sound with all guards,
lifecycle invariants, and cross-language consistency checks in place. The single item recommended for
immediate attention is a stale option-count assertion in onboarding.md that would mislead a first-time
deployer.

---

## Section 1: Gate State Verification

Gates were run fresh from the repository root on 2026-06-03.

### JavaScript / TypeScript (`apps/wizard`)

**`pnpm lint`** — exit 0

```
> eslint . --max-warnings=0
(no output — zero errors, zero warnings)
```

**`pnpm typecheck`** — exit 0

```
> tsc --noEmit && tsc --noEmit -p tsconfig.test.json
(no output — zero errors)
```

**`pnpm test`** — exit 0

```
 Test Files  22 passed (22)
       Tests  362 passed (362)
    Start at  15:48:35
    Duration  7.92s
```

**`pnpm build`** — exit 0

```
dist/manifest.json                          0.43 kB │ gzip:  0.21 kB
dist/assets/inter-variable.Dx4kXJAl.woff2 48.26 kB
dist/wizard.DNbVc2i4.css                   17.15 kB │ gzip:  4.00 kB
dist/wizard.BSqnbXnl.js                   241.20 kB │ gzip: 70.61 kB │ map: 776.95 kB
✓ built in 2.37s
```

No unexpected warnings in any JS/TS gate.

### PHP (`plugins/quote-wizard`)

**`composer lint`** — exit 0

```
............................. 29 / 29 (100%)
Time: 13.73 secs; Memory: 16MB
(no errors, no warnings)
```

**`composer analyse`** — exit 0

```
(PHPStan level 8; no errors)
```

**`composer test`** — exit 0

```
Tests:    68 passed (125 assertions)
Duration: 8.35s
```

### Comparison against documentation claims

| Claim source                                       | Claimed   | Actual    | Status           |
| -------------------------------------------------- | --------- | --------- | ---------------- |
| `docs/current-state.md` — Vitest count             | 362/362   | 362/362   | ✓ Match          |
| `docs/current-state.md` — PHP count                | 68/68     | 68/68     | ✓ Match          |
| `docs/current-state.md` — lint                     | 0/0       | 0/0       | ✓ Match          |
| `docs/phase-5-evidence.md` §5.1 — JS gzip          | 70.61 kB  | 70.61 kB  | ✓ Match          |
| `docs/phase-5-evidence.md` §5.1 — JS raw           | 241.20 kB | 241.20 kB | ✓ Match          |
| `docs/bundle-baseline-4.6.md` — gzip ceiling watch | 80 kB     | 70.61 kB  | ✓ Within ceiling |

No gate discrepancies. Bundle delta from documented 5.1 baseline is 0.00 kB (exact match on fresh build).

---

## Section 2: 5.1 Implementation Verification

### 2.1 Route table cross-language consistency

```
PASS  Tests\Unit\Routing\CrossLanguageRoutesTest
  ✓ it TypeScript routes.ts and PHP SiteRoutes::PATHS are in sync    0.03s

Tests:    1 passed (2 assertions)
Duration: 0.33s
EXIT: 0
```

Test exists at `plugins/quote-wizard/tests/Unit/Routing/CrossLanguageRoutesTest.php`. Passes.
The test parses `apps/wizard/src/site/routing/routes.ts` with the regex `/path:\s*'([^']+)'/` and
asserts the extracted paths equal `SiteRoutes::PATHS` exactly.

### 2.2 Route interception scope discipline

File: `plugins/quote-wizard/src/Routing/RouteInterceptor.php`

All five scope guards are present:

| Guard             | Line | Code                                                           |
| ----------------- | ---- | -------------------------------------------------------------- |
| `is_admin()`      | 43   | `if ( is_admin() ) { return; }`                                |
| `REST_REQUEST`    | 46   | `if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) { return; }` |
| `DOING_CRON`      | 49   | `if ( defined( 'DOING_CRON' ) && DOING_CRON ) { return; }`     |
| `WP_CLI`          | 52   | `if ( defined( 'WP_CLI' ) && WP_CLI ) { return; }`             |
| `is_main_query()` | 55   | `if ( ! $query->is_main_query() ) { return; }`                 |

The exact-match check against `SiteRoutes::is_recognized()`:

```php
// RouteInterceptor.php lines 59-62
$request_path = $this->current_request_path();
if ( ! SiteRoutes::is_recognized( $request_path ) ) {
    return;
}
```

All six guards verified. No missing guards.

### 2.3 Site Root page lifecycle

**`ensure()` idempotency** (`SiteRootPage.php` lines 47-82):

Early-return path (no-op):

```php
// lines 50-58
if ( $stored_id > 0 ) {
    $post = get_post( $stored_id );
    if (
        $post instanceof \WP_Post &&
        $post->post_status === 'publish' &&
        $post->post_type === 'page'
    ) {
        return $stored_id;
    }
}
```

Create path runs only when stored ID is 0, the post is missing, or the post is not published as a page.

**Created with correct status and type** (`SiteRootPage.php` lines 61-72):

```php
$page_id = wp_insert_post(
    array(
        'post_title'  => self::TITLE,
        'post_name'   => self::SLUG,
        'post_status' => 'publish',
        'post_type'   => 'page',
        ...
    ),
    true
);
```

**Slug**: `goqw-site-root` (constant at `SiteRootPage.php` line 31).

**Activator calls `ensure()`** (`Activator.php` line 55):

```php
$page->ensure();
```

**Uninstall deletes the page** (`uninstall.php` lines 41-44):

```php
$site_root_id = (int) get_option( 'goqw_site_root_page_id', 0 );
if ( $site_root_id > 0 ) {
    wp_delete_post( $site_root_id, true );
}
```

The `goqw_site_root_page_id` option itself is removed by the wildcard `goqw_%` LIKE query at lines 57-68.

### 2.4 Front-page policy non-invasive behaviour

File: `plugins/quote-wizard/src/Routing/FrontPagePolicy.php`

**"No front page configured" condition** covers both required cases (lines 49-51):

```php
$no_front_page_configured =
    $show_on_front === 'posts' ||
    ( $show_on_front === 'page' && $page_on_front === 0 );
```

**"Front page configured" branch** does NOT modify `show_on_front` or `page_on_front` (lines 59-68):

```php
// Existing front page is configured by the site owner — leave it alone.
set_transient(
    self::NOTICE_TRANSIENT,
    array(
        'site_root_id' => $site_root_id,
        'existing_id'  => $page_on_front,
    ),
    DAY_IN_SECONDS
);
return false;
```

Only `set_transient` is called. No write to `show_on_front` or `page_on_front`. Non-invasive behaviour confirmed.

### 2.5 Self-healing on `init`

`SelfHealer.php` exists at `plugins/quote-wizard/src/Routing/SelfHealer.php`. The init hook
registration in `Plugin.php` (line 47):

```php
add_action( 'init', array( $healer, 'check' ) );
```

Verified wired.

### 2.6 React mount reads `data-initial-path`

File: `apps/wizard/src/main.tsx` lines 22-31:

```typescript
function warnIfPathMismatch(container: HTMLElement): void {
  const attrPath = container.getAttribute('data-initial-path');
  if (attrPath === null) return;
  const livePath = window.location.pathname;
  if (attrPath !== livePath) {
    console.warn(
      `[goqw] data-initial-path (${attrPath}) differs from window.location.pathname (${livePath}); using window.location.`,
    );
  }
}
```

Called at line 45 (`warnIfPathMismatch(container)`) inside `mount()` before `createRoot`.
The Router continues to use `window.location.pathname` as authoritative (via `SiteApp.tsx` line 12);
the attribute is diagnostic only.

### 2.7 LocalWP smoke test

LocalWP is not available in this audit environment (running under Claude Code on Windows with no
active WP process). The smoke test commands (`curl` against a `.local` domain, `wp` CLI commands)
cannot be executed.

**Finding:** The most important integration claim of Step 5.1 — that all five routes serve the
React app in a real WordPress install — is **unverified in this audit**. The unit tests verify
each routing class in isolation; the cross-language test verifies route-table consistency; but
end-to-end route serving requires a live WordPress environment.

See F1 in the findings list for the related documentation discrepancy that would affect a first
deployment.

---

## Section 3: Documentation Consistency Check

### Required files

| File                       | Present                           |
| -------------------------- | --------------------------------- |
| `docs/current-state.md`    | ✓                                 |
| `docs/handoff.md`          | ✓                                 |
| `docs/technical-debt.md`   | ✓                                 |
| `docs/onboarding.md`       | ✓                                 |
| `docs/roadmap.md`          | ✓                                 |
| `docs/phase-5-evidence.md` | ✓                                 |
| Bundle baseline file       | ✓ (`docs/bundle-baseline-4.6.md`) |

All required files present.

Note on the bundle baseline: `docs/bundle-baseline-4.6.md` is the only baseline file. It was
current at Step 4.6 (66.4 kB gzip JS). The current bundle is 70.61 kB. The step-by-step
evidence reports document the delta at each step, but there is no single canonical baseline
document reflecting the Step 5.1 state. See **F3**.

### Cross-document consistency checks

**`current-state.md` ↔ `roadmap.md` — latest completed step**

Both agree: Step 5.1 (WordPress page mapping + production routing) is the latest completed step.
Phase 5 is marked complete. ✓

**`current-state.md` ↔ `handoff.md` — "next step" recommendation**

Both agree: next step is operational — real client deployment to WordPress. Neither proposes a
follow-on code step. ✓

**`technical-debt.md` ↔ `roadmap.md` — deferred items**

**DISCREPANCY — see F2.**

`roadmap.md` lists 8 deferred items. `technical-debt.md` lists 5 entries. Three roadmap deferred
items have no corresponding entry in `technical-debt.md`:

| In `roadmap.md`                  | In `technical-debt.md` |
| -------------------------------- | ---------------------- |
| Admin replay UI for failed sends | ✗ Missing              |
| SSR / static rendering           | ✗ Missing              |
| h-10 Tailwind utility hygiene    | ✗ Missing              |
| 4.8 Media uploads                | ✓ Present              |
| Idempotency for submission retry | ✓ Present              |
| Rate limiting on submit endpoint | ✓ Present              |
| Component testing in jsdom       | ✓ Present              |
| Multisite WordPress support      | ✓ Present              |

**`current-state.md` ↔ gate output (§1) — test count, bundle size, lint**

All values match exactly. ✓

**`phase-5-evidence.md` ↔ `current-state.md` — 5.1 completion status**

Both record Step 5.1 as complete; both record 362 Vitest / 68 PHP; both record 70.61 kB gzip.
`phase-5-evidence.md` also records the full 27-criterion acceptance checklist and 9-commit
table, which are not replicated in `current-state.md` (appropriate separation). ✓

**`roadmap.md` ↔ ADR-0014 "(b) not (c)" commitment**

`roadmap.md` out-of-scope section: "CMS / operator content editing (per ADR-0014, target is (b)
not (c))". ADR-0014 was not read end-to-end in this audit (outside the required file list), but
the roadmap correctly quotes the ADR number and commitment string. No finding raised.

**`onboarding.md` ↔ `Activator.php` — documented option count**

**DISCREPANCY — see F1.**

`onboarding.md` "Step 6 — Verify the install" (line 132):

```
wp option list --search="goqw_*" --format=count   # expect 10
```

`Activator.php` `set_default_options()` seeds 11 options:

1. `goqw_webhook_url`
2. `goqw_agency_notification_email`
3. `goqw_business_name`
4. `goqw_business_phone`
5. `goqw_business_email`
6. `goqw_primary_color`
7. `goqw_calendly_url`
8. `goqw_plugin_version`
9. `goqw_wizard_id`
10. `goqw_enabled_services`
11. `goqw_site_root_page_id` (added in Step 5.1, `Activator.php` line 75)

The onboarding "Deploying to a WordPress site (Step 5.1)" section (further down the same file)
correctly states 11. The "Step 6" section was not updated when the 11th option was added in 5.1.
The two sections in the same file contradict each other.

---

## Section 4: Undocumented Decisions Inventory

Files read end-to-end: `App.tsx`, `main.tsx`, `SiteApp.tsx`, `Router.tsx`, `Link.tsx`,
`routes.ts`, `QuotePage.tsx`, `WizardProvider.tsx`, `http-submission-port.ts`, `services.ts`,
`decking.config.ts`, all `plugins/quote-wizard/src/Routing/*.php`, `SubmissionController.php`,
`PublicConfig.php`.

---

**U1** — `main.tsx` lines 55-62: `document.readyState` guard for dev-mode mounting

```typescript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
```

The comment says "The bundle is enqueued in the page footer by WordPress in production, so the
DOM is already ready." The guard exists because Vite dev server places scripts in `<head>` by
default, causing this to run before the DOM is parsed. In production the `else` branch always
runs. A contributor might remove this guard thinking it's dead code, which would break `pnpm dev`
silently (the wizard would fail to mount in development but continue to work in production, making
the bug hard to notice).

---

**U2** — `Link.tsx` line 33: scroll-to-top on pushState only

```typescript
window.scrollTo(0, 0);
```

This call is inside `handleClick` (forward navigation via `<Link>`) but is absent from
`SiteApp.tsx`'s `popstate` listener (line 16-18). The result: forward navigation resets scroll to
top; browser back/forward preserves scroll position. This is correct UX behavior but is not
documented in any comment, ADR, or spec. A contributor adding navigation logic might accidentally
add `scrollTo` to the popstate handler, breaking back-button scroll restoration.

---

**U3** — `SiteApp.tsx` line 12: SSR safety guard

```typescript
const [pathname, setPathname] = useState(() =>
  typeof window === 'undefined' ? '/' : window.location.pathname,
);
```

SSR is explicitly out of scope (`roadmap.md`: "SSR / static rendering"). This `typeof window`
guard is dead code in every current deployment target. A contributor might infer that SSR support
is partially in place. The guard costs nothing and does not need removing, but its presence without
a comment creates a misleading implication.

---

**U4** — `RouteInterceptor.php` lines 79-85 and `SiteRenderer.php` lines 81-87: duplicated
`current_request_path()` method

Both classes contain an identical private method:

```php
private function current_request_path(): string {
    // phpcs:ignore ...
    $uri = (string) ( $_SERVER['REQUEST_URI'] ?? '/' );
    // phpcs:ignore ...
    $path = parse_url( $uri, PHP_URL_PATH );
    return is_string( $path ) ? $path : '/';
}
```

No shared helper class or trait extracts this logic. If the method needs updating (e.g., to
account for a reverse-proxy `X-Forwarded-Uri` header, or to add unit-testable injection), both
files must be changed independently. There is no test that would catch a divergence between the
two copies. See **F4**.

---

**U5** — `http-submission-port.ts` line 69: 30-second timeout

```typescript
const timeoutMs = options.timeoutMs ?? 30_000;
```

The PHP `Forwarder` uses `wp_remote_post` with a 10-second timeout (WordPress default). The JS
client uses 30 seconds. The asymmetry means the browser will wait 30s before giving up, even
though the PHP side will have already timed out and returned a 502 after 10s. The 30s value was
chosen to leave headroom for slow connections. This is reasonable but the reasoning is not
documented.

---

**U6** — `http-submission-port.ts` lines 136-138: HTTP 422 mapped to `validation_failed`

```typescript
if (response.status === 400 || response.status === 422) {
  return err_(ERR_VALIDATION, MSG_FALLBACK, false);
}
```

The PHP `SubmissionController` only returns 400 for validation errors. The 422 mapping is
defensive (handles future API changes or middleware that returns 422 for validation failures) but
is unannounced — no comment explains why 422 is included or which layer might emit it.

---

**U7** — `QuotePage.tsx` lines 22-32: module-level submission port and service list

```typescript
const devSubmissionPort: SubmissionPort = { ... };  // line 16-21 — module level, no comment
const submissionPort: SubmissionPort = ...;          // lines 23-26 — module level, no comment
const enabledIds = listEnabledServiceIds(...);       // line 29 — has comment "Compute once at module load"
const services = enabledIds.map(...);                // lines 30-32 — no comment
```

`enabledIds` has a comment explaining the module-level placement. `devSubmissionPort` and
`submissionPort` do not. A contributor refactoring this into a hook or adding lazy loading might
inadvertently move the submission port inside the render cycle, causing a new port to be
constructed on every render and breaking the `WizardProvider` store key stability.

---

**U8** — `QuotePage.tsx` lines 95-101: silent fallback when `resolveService` returns null

```typescript
if (store === null) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <ServiceSelector services={services} onSelect={setSelectedId} />
    </div>
  );
}
```

This branch runs when a `selectedId` is set but `resolveService(selectedId)` returns `null`
(i.e., an ID that was valid when selected but is no longer in the registry). The selector is
re-shown silently with no console error or user-visible message. A contributor investigating a
reported "service selector keeps reappearing" bug would not find an obvious log entry.

---

**U9** — `Activator.php` lines 55-56: `ensure()` called twice on activation

```php
$page->ensure();             // line 55 — direct call
$policy->apply_on_activation();  // line 56 — internally calls $page->ensure() again
```

`FrontPagePolicy::apply_on_activation()` calls `$page->ensure()` on its first line
(`FrontPagePolicy.php` line 45). Since `Activator::setup_site_routing()` also calls `$page->ensure()`
directly before calling `$policy->apply_on_activation()`, the page lifecycle runs twice on
activation. This is safe (idempotent) but creates a redundant database read+write on every
activation. Not a correctness issue, but a contributor auditing activation performance might be
puzzled by the double call.

---

**U10** — `SiteRenderer.php` line 41 / class docblock: `the_content` filter at priority 5

The class docblock says "the_content (priority 5)" but does not explain why priority 5 rather
than the default 10. The reason: `wpautop` (WordPress's automatic paragraph injection) runs at
priority 10 and would wrap the `<div id="qw-root">` in a `<p>` tag if this filter ran after it.
Priority 5 fires before `wpautop`, preventing the `<p>` wrapping. A contributor raising the
priority to 10 (the "obvious" default) would introduce a subtle rendering bug where the React
mount node is wrapped in a paragraph element, which is invalid HTML and may cause rendering
differences across browsers.

---

## Findings

### F1 (MINOR) — Stale option count in onboarding.md "Step 6"

**What:** `docs/onboarding.md` "Step 6 — Verify the install" line 132 reads:

```
wp option list --search="goqw_*" --format=count   # expect 10
```

`Activator.php` seeds 11 options (`goqw_site_root_page_id` was added in Step 5.1). The "Deploying
to a WordPress site" section in the same file correctly says 11. The two sections contradict each
other.

**Evidence:** `Activator.php` `set_default_options()` lines 65-75: 10 calls to `add_option()` plus
`add_option( SiteRootPage::OPTION_KEY, 0 )` = 11 total.
`onboarding.md` line 132: `# expect 10` (stale).
`onboarding.md` (Step 5.1 deployment section): `# Confirm all 11 options were seeded` (current).

**Recommendation:** Change "expect 10" to "expect 11" at `onboarding.md` line 132.

---

### F2 (MINOR) — technical-debt.md missing three deferred items from roadmap.md

**What:** `docs/roadmap.md` "Deferred (with triggers)" lists 8 items. `docs/technical-debt.md`
has 5 entries. Three items present in roadmap.md have no corresponding entry in technical-debt.md:
"Admin replay UI for failed sends", "SSR / static rendering", "h-10 Tailwind utility hygiene".

**Evidence:** `roadmap.md` deferred table (lines 27-36); `technical-debt.md` (5 sections, ending
at Multisite WordPress Support).

**Recommendation:** Add the three missing entries to `technical-debt.md` with trigger conditions,
or remove them from `roadmap.md`'s deferred list if they were added without a corresponding
deferral decision.

---

### F3 (MINOR) — Bundle baseline file not updated since Step 4.6

**What:** `docs/bundle-baseline-4.6.md` is the only bundle baseline document. It was captured at
Step 4.6 (66.4 kB gzip JS). The current bundle is 70.61 kB gzip — a 4.2 kB increase over two
major steps. The numbers are recorded in `phase-5-evidence.md` section by section, but there is
no single current-state baseline file to compare against for the next step.

**Evidence:** `docs/bundle-baseline-4.6.md` (records 66.4 kB); `docs/phase-5-evidence.md` Step
5.1 bundle delta table (records 70.61 kB as the current state); no `bundle-baseline-5.1.md`
exists.

**Recommendation:** Create `docs/bundle-baseline-5.1.md` capturing the current JS/CSS sizes
(241.20 kB / 70.61 kB gzip) as the reference point for the next step.

---

### F4 (MINOR) — `current_request_path()` duplicated in RouteInterceptor and SiteRenderer

**What:** Both `plugins/quote-wizard/src/Routing/RouteInterceptor.php` (lines 79-85) and
`plugins/quote-wizard/src/Routing/SiteRenderer.php` (lines 81-87) contain an identical private
method `current_request_path()`. If the implementation needs changing (e.g., to handle a reverse
proxy header), both files must be edited independently with no mechanical enforcement of
consistency.

**Evidence:** RouteInterceptor.php lines 79-85; SiteRenderer.php lines 81-87. Both are verbatim
identical.

**Recommendation:** Extract `current_request_path()` to a static helper method on `SiteRoutes`
(the existing route-table class) or a new `RequestContext` helper. Mark it `@internal` if it
should not be part of the public API.

---

## Findings requiring fixes before any further development

**F1** — Update `onboarding.md` line 132 from "expect 10" to "expect 11". The next step is
the first real client deployment; this stale assertion is the one finding a deployer would
encounter immediately.

F2, F3, F4 are doc/code-quality gaps that do not block any further work. They are included in the
findings list for tracking.
