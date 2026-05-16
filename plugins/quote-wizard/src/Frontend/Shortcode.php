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
 * app's main.tsx expects. In Step 3E, AssetLoader will enqueue the React
 * bundle on pages that contain this shortcode; until then, the div renders
 * empty.
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
	 * shortcode's presence in post content (AssetLoader uses this in Step 3E).
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

		// Output is intentionally minimal. All styling and content come from
		// the React bundle. The data-mount attribute is informational; it lets
		// integrators spot the wizard in DOM inspectors quickly.
		return sprintf(
			'<div id="%1$s" data-mount="quote-wizard"></div>',
			esc_attr( self::MOUNT_ID )
		);
	}
}
