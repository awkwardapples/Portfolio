# Audit E — REST Endpoint Authentication Model (Step 6.6)

## Command

```powershell
Get-Content "plugins/quote-wizard/src/Plugin.php" | Select-String "register_rest_route|permission_callback"
```

**Corrected assumption:** the spec's command targets
`SubmissionController.php`, but `register_rest_route()` and the
`permission_callback` are not defined there — they live in `Plugin.php`
(inside the `rest_api_init` action), which constructs the controller and
registers the route. `SubmissionController::handle()` is only the route's
`callback`; it has no knowledge of the permission model itself.

## Result

```php
\register_rest_route(
    'qw/v1',
    '/submit',
    array(
        'methods'             => 'POST',
        'callback'            => array( $controller, 'handle' ),
        'permission_callback' => static function ( \WP_REST_Request $req ): bool {
            $nonce = $req->get_header( 'X-WP-Nonce' );
            return null !== $nonce && false !== \wp_verify_nonce( $nonce, 'wp_rest' );
        },
    )
);
```

## Permission model

- **Not login-authentication.** `wp_verify_nonce($nonce, 'wp_rest')`
  validates a WordPress REST nonce, which WordPress issues to **any**
  visitor (logged in or not) via `wp_create_nonce('wp_rest')` —
  `PublicConfig::build()` generates this nonce and embeds it in the
  page for the React app to send back as `X-WP-Nonce`. This is the
  standard WordPress pattern for "this request came from a page this site
  served, not an arbitrary cross-origin script" — it is a **CSRF/origin
  check**, not an identity check. The wizard is public-facing by design
  (anonymous visitors submit quotes); requiring a _logged-in_ user would
  break the feature entirely.
- **No capability check** (`current_user_can()` is never called on this
  route) — correct, since the operation (submit a quote request) is
  intentionally available to unauthenticated visitors.
- **Privilege escalation:** not possible via this endpoint. The nonce
  check only gates _whether the request is accepted at all_; it grants no
  elevated capability, and `SubmissionController::handle()` performs no
  action beyond inserting one row and issuing one outbound HTTP POST —
  there is no code path here that reads/writes any other user's data,
  changes settings, or exposes an admin capability. A visitor who forges
  or omits the nonce simply gets a REST-level 401-equivalent rejection
  (WordPress's default `rest_cookie_invalid_nonce`-style response) before
  `handle()` ever runs.
- **What the nonce actually blocks:** a third-party site cannot silently
  POST to this endpoint on a victim's behalf using their logged-in
  WordPress session cookie (classic CSRF), because it can't read the
  nonce value embedded in the first-party page. It does **not** block a
  direct, deliberate POST from a normal HTTP client — anyone can load the
  public wizard page, read the nonce out of its embedded config, and then
  script arbitrary submissions (this is expected: rate limiting and bot
  protection, from Step 5.13f, are what actually bound abuse volume here,
  not the nonce).

## Conclusion

No authentication/authorization gap exists relative to the endpoint's
intended use (anonymous quote submission). No privilege escalation path.
Bot/rate-limit protection (unchanged by this step, per "What This Step
Does NOT Do") is the correct control for abuse volume, and the nonce is
the correct control for cross-origin forgery — both already in place and
unaffected by the sanitization work in this step.
