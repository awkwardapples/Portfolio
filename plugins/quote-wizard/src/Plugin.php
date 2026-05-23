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
 */
final class Plugin {

	/**
	 * Register all hooks. Idempotent.
	 */
	public static function boot(): void {
		// Frontend: shortcode that renders the wizard mount point.
		add_shortcode( Shortcode::TAG, array( Shortcode::class, 'render' ) );

		// Frontend: enqueue the built React bundle when the shortcode is on the page.
		add_action( 'wp_enqueue_scripts', array( AssetLoader::class, 'maybe_enqueue' ) );

		// Admin: surface a notice anywhere in wp-admin when the build is missing.
		add_action( 'admin_notices', array( AssetLoader::class, 'render_admin_notice' ) ); // @phpstan-ignore argument.type

		// REST: register the submit endpoint.
		add_action( 'rest_api_init', array( SubmitController::class, 'register_routes' ) );
	}
}
