<?php
/**
 * PHPStan bootstrap.
 *
 * Declares constants set elsewhere (wp-config.php) so PHPStan understands
 * `defined()` checks and conditional access.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

if ( ! defined( 'WP_DEBUG_LOG' ) ) {
	define( 'WP_DEBUG_LOG', false );
}

if ( ! defined( 'GOQW_VERSION' ) ) {
	define( 'GOQW_VERSION', '0.1.0' );
}
