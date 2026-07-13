# Audit D — Current Cron Registration Pattern (5.13e)

_Performed: 2026-07-13_

## File examined

`plugins/quote-wizard/src/Activator.php`, `plugins/quote-wizard/src/Cron/PruneSubmissions.php`

## Existing scheduled event

`Activator::schedule_cron_events()` ([Activator.php:98-102](Activator.php#L98-L102)):

```php
private static function schedule_cron_events(): void {
    if ( ! wp_next_scheduled( 'goqw_prune_submissions' ) ) {
        wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'goqw_prune_submissions' );
    }
}
```

Called from `Activator::activate()`, guarded by `wp_next_scheduled()` so reactivating the
plugin does not double-schedule. Frequency: `daily`. First run: one hour after
activation (not immediately — avoids racing the activation request itself).

## The callback is registered where, and is itself a stub

`add_action( 'goqw_prune_submissions', ... )` is **not** present anywhere in
`Plugin.php` today — only the event is scheduled, not the callback hooked. Reading
`Cron\PruneSubmissions.php`:

```php
final class PruneSubmissions {
    public static function run(): void {
        // Real implementation in Step 6.5.
    }
}
```

This is a Step-3D stub. The cron event fires daily but currently does nothing (no hook
attached, and even if attached, the callback body is empty). This is the concrete form
of the item `docs/current-state.md` lists under "What's NOT yet built": _"Media
retention policy (deferred per 4.8 spec)"_ — 5.13e's `PhotoRetention` addresses the photo
side of that deferral; submission-row pruning (`PruneSubmissions`) remains deferred to
Step 6.5 and is untouched by this step.

## Pattern to replicate for `PhotoRetention`

Same three-part shape, applied to the new photo-retention event:

1. **Schedule** in `Activator::schedule_cron_events()` (extend the existing private
   method, same idempotency guard):
   ```php
   if ( ! wp_next_scheduled( 'goqw_photo_retention_cleanup' ) ) {
       wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'goqw_photo_retention_cleanup' );
   }
   ```
2. **Hook the callback** — unlike `goqw_prune_submissions`, this must actually be wired
   in `Plugin::boot()`:
   ```php
   add_action( 'goqw_photo_retention_cleanup', [ PhotoRetention::class, 'run' ] );
   ```
   (`PruneSubmissions` was never wired; `PhotoRetention` should not repeat that gap since
   this step's callback is a real implementation, not a stub.)
3. **Implement**, unlike `PruneSubmissions::run()`, with real logic (6-month cutoff,
   query attachments under the `goqw` upload subpath, `wp_delete_attachment()` each).

## Deactivation

`plugins/quote-wizard/src/Deactivator.php` was not required for this audit's scope but
should be checked during implementation for whether `wp_clear_scheduled_hook()` is called
for `goqw_prune_submissions` — if so, `goqw_photo_retention_cleanup` needs the same
treatment for symmetry.
