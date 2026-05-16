<?php
/**
 * Plugin bootstrap.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard;

use Agency\QuoteWizard\Frontend\AssetLoader;
use Agency\QuoteWizard\Frontend\Shortcode;
use Agency\QuoteWizard\Rest\SubmitController;

defined( 'ABSPATH' ) || exit;

/**
 * Wires WordPress hooks for the plugin.
 *
 * Boot is called once per request. Everything it does should be cheap (hook
 * registration only); heavy work happens inside the hook callbacks.
 */
final class Plugin {

	/**
	 * Register all hooks. Idempotent — calling twice is harmless.
	 */
	public static function boot(): void {
		// Frontend: shortcode that renders the wizard mount point.
		add_shortcode( Shortcode::TAG, array( Shortcode::class, 'render' ) );

		// Frontend: enqueue the built React bundle when the shortcode is on the page.
		// AssetLoader is a stub in Step 3D and gets its real body in Step 3E.
		add_action( 'wp_enqueue_scripts', array( AssetLoader::class, 'maybe_enqueue' ) );

		// REST: register the submit endpoint. Stub in Step 3D; full handler in Step 5.1.
		add_action( 'rest_api_init', array( SubmitController::class, 'register_routes' ) );
	}
}
