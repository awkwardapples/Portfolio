<?php
/**
 * Plugin Name:       Quote Wizard
 * Plugin URI:        https://example.com/quote-wizard
 * Description:       Embeds a configurable React quote wizard into WordPress.
 * Version:           0.1.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Agency
 * License:           UNLICENSED
 * Text Domain:       quote-wizard
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard;

defined( 'ABSPATH' ) || exit;

// -----------------------------------------------------------------------------
// Plugin Constants
// -----------------------------------------------------------------------------
define( 'GOQW_VERSION', '0.2.0' );
define( 'GOQW_PLUGIN_FILE', __FILE__ );
define( 'GOQW_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'GOQW_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// -----------------------------------------------------------------------------
// PSR-4 Autoloader
// -----------------------------------------------------------------------------
spl_autoload_register(
	static function ( string $class_name ): void {
		$prefix = 'Agency\\QuoteWizard\\';
		if ( ! str_starts_with( $class_name, $prefix ) ) {
			return;
		}
		$relative_class = substr( $class_name, strlen( $prefix ) );
		$relative_path  = str_replace( '\\', DIRECTORY_SEPARATOR, $relative_class ) . '.php';
		$file           = GOQW_PLUGIN_DIR . 'src' . DIRECTORY_SEPARATOR . $relative_path;

		if ( is_readable( $file ) ) {
			require_once $file;
		}
	}
);

// -----------------------------------------------------------------------------
// Activation / Deactivation
// -----------------------------------------------------------------------------
register_activation_hook( __FILE__, array( Activator::class, 'activate' ) );
register_deactivation_hook( __FILE__, array( Deactivator::class, 'deactivate' ) );

// -----------------------------------------------------------------------------
// Boot Plugin
// -----------------------------------------------------------------------------
add_action(
	'plugins_loaded',
	function () {
		// Debug banner for admins.
		if ( current_user_can( 'manage_options' ) ) {
			add_action(
				'wp_footer',
				function () {
					echo '<div style="position:fixed;bottom:10px;right:10px;background:#000;color:#0f0;padding:8px 12px;font-family:monospace;z-index:99999;">';
					echo '✅ Quote Wizard PLUGIN LOADED (Debug Mode)';
					echo '</div>';
				}
			);
		}

		Plugin::boot();
	}
);
