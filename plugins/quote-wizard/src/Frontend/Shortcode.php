<?php
/**
 * [quote_wizard] shortcode.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

defined( 'ABSPATH' ) || exit;

/**
 * Renders the React mount point.
 *
 * Usage in a WordPress page: [quote_wizard]
 *
 * The shortcode emits a single <div id="qw-root"> matching what the React
 * app's main.tsx expects. AssetLoader (registered via Plugin::boot) enqueues
 * the React bundle on pages that contain this shortcode.
 *
 * If the build assets are missing or malformed, AssetLoader records this in
 * its build_state and the shortcode emits an admin-visible warning so the
 * misconfiguration is loud for developers but silent for end users.
 *
 * Why a shortcode rather than a Gutenberg block:
 *   - Shortcodes work in any editor (Classic, Gutenberg, page builders).
 *   - Trivial to embed in templates: `do_shortcode('[quote_wizard]')`.
 *   - A Gutenberg block can be added later as a thin wrapper; deferred per
 *     the no-speculative-architecture principle.
 */
final class Shortcode {

	/**
	 * The shortcode tag. Used both for `add_shortcode` and to detect the
	 * shortcode's presence in post content.
	 */
	public const TAG = 'quote_wizard';

	/**
	 * Mount element ID. Must match what apps/wizard/src/main.tsx looks for.
	 */
	public const MOUNT_ID = 'qw-root';

	/**
	 * Render the shortcode.
	 *
	 * @param array<string, string>|string $atts Shortcode attributes (unused for v1).
	 * @return string HTML to inject in place of the shortcode.
	 */
	public static function render( $atts = array() ): string {
		// Suppress unused-arg complaints from PHPCS. Reserved for future
		// per-instance overrides (e.g. [quote_wizard trade="fencing"]).
		unset( $atts );

		$mount = sprintf(
			'<div id="%1$s" data-mount="quote-wizard"></div>',
			esc_attr( self::MOUNT_ID )
		);

		// If the build is missing, add an admin-visible warning ABOVE the mount
		// div so the developer/operator sees the cause immediately. Regular
		// visitors with no manage_options capability see only the empty mount.
		if ( 'missing' === AssetLoader::build_state() && current_user_can( 'manage_options' ) ) {
			return self::admin_warning_html() . $mount;
		}

		return $mount;
	}

	/**
	 * The admin-visible warning shown above the mount when the build is missing.
	 */
	private static function admin_warning_html(): string {
		$title   = esc_html__( 'Quote Wizard: build assets missing', 'quote-wizard' );
		$message = esc_html__(
			'The plugin could not find or read the compiled React assets. This message is only visible to administrators.',
			'quote-wizard'
		);
		$hint = esc_html__(
			'Run the build pipeline: from the repo root, "pnpm --filter @growth-ops/wizard build" then copy apps/wizard/dist/ into plugins/quote-wizard/assets/dist/. The full pipeline ships in Step 3F.',
			'quote-wizard'
		);

		return sprintf(
			'<div style="border:1px solid #d63638;background:#fcf0f1;padding:12px 16px;margin:0 0 16px;border-radius:4px;font-family:system-ui,sans-serif;">'
				. '<p style="margin:0 0 4px;font-weight:600;color:#d63638;">%1$s</p>'
				. '<p style="margin:0 0 4px;color:#1d2327;">%2$s</p>'
				. '<p style="margin:0;color:#50575e;font-size:13px;">%3$s</p>'
			. '</div>',
			$title,
			$message,
			$hint
		);
	}
}
