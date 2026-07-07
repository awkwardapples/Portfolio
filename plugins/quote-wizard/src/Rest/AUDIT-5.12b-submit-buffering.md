# Audit B — REST Endpoint Response Handling (5.12b)

_Performed: 2026-07-07_

## File examined

`plugins/quote-wizard/src/Rest/SubmissionController.php`

Note: the spec referenced `Submit.php`, but the actual file is `SubmissionController.php`.
There is no `Submit.php` — the class was named `SubmissionController` when implemented.

## Handler structure

`SubmissionController::handle(WP_REST_Request $request): WP_REST_Response`

- Returns `WP_REST_Response` objects — no direct `echo`, `print`, `wp_send_json`, or
  `header()` calls.
- 4 return paths:
  - 400 (validation_failed)
  - 400 (media_validation_failed)
  - 500 (persistence_failed)
  - 502 (forwarder_unavailable)
  - 200 (success)

## Logging analysis

`Logger::operational()` is called on persistence failure and forward failure.
`Logger::write()` uses `error_log()` for all severity levels — writes to the PHP error
log file, NOT to stdout. No risk of output corruption from the logger.

## Output corruption risk

The handler code itself never outputs to stdout. The risk vector is **environmental**:

- If `WP_DEBUG = true` AND `WP_DEBUG_DISPLAY = true` (or `display_errors = On`), PHP
  prints notices/warnings to stdout, which get prepended to the REST response body.
- Common in LocalWP development installs when `wp-config.php` has:
  ```php
  define( 'WP_DEBUG', true );
  define( 'WP_DEBUG_DISPLAY', true ); // or missing, defaults to true when WP_DEBUG=true
  ```
- A duplicate `define('WP_DEBUG', ...)` triggers "PHP Warning: Constant WP_DEBUG already
  defined in ... on line X" which is displayed before the JSON body.

## Fix

Wrap the handler body in `ob_start()` / `ob_end_clean()` using `try/finally` so any
output leaked during execution (from WordPress core, other plugins, or debug settings)
is captured and discarded before the `WP_REST_Response` is returned.

Pattern:

```php
public function handle( WP_REST_Request $request ): WP_REST_Response {
    ob_start();
    try {
        // ... existing handler body ...
        return $response;
    } finally {
        ob_end_clean();
    }
}
```

The `finally` block runs after the `return` statement but before the caller receives
the value, so `ob_end_clean()` discards any leaked output without affecting the response.

## Points where output could interfere (in order of likelihood)

1. `WP_DEBUG_DISPLAY=true` PHP notice/warning from any WordPress code during request
2. Theme or other plugin outputting early content before REST response headers are sent
3. Any `Logger::warning()` that calls `error_log()` — safe, NOT stdout
