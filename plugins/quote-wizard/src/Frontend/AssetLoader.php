<?php
/**
 * Frontend asset enqueueing.
 *
 * STUB FOR STEP 3D — real implementation lands in Step 3E.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueues the built React bundle and CSS on pages containing the shortcode.
 *
 * Step 3E will:
 *   - Read assets/dist/manifest.json to resolve hashed filenames.
 *   - Conditionally enqueue only when Shortcode::TAG is present in the
 *     current post's content (avoid loading on every page).
 *   - Use wp_localize_script to pass the REST URL, nonce, business name,
 *     and primary colour to the React app via window.qwConfig.
 *
 * Until 3E ships, this class is a no-op so the plugin activates and the
 * shortcode renders cleanly without spurious console errors.
 */
final class AssetLoader {

	/**
	 * Conditionally enqueue wizard assets.
	 *
	 * Hooked to wp_enqueue_scripts in Plugin::boot(). On every front-end
	 * page load. Must be cheap; the conditional check happens here.
	 */
	public static function maybe_enqueue(): void {
		// Intentional no-op for Step 3D.
		// Real body arrives in Step 3E.
	}
}
