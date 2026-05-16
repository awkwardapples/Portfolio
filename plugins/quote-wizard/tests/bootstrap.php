<?php
/**
 * PHPUnit / Pest test bootstrap.
 *
 * Loads the Composer autoloader and prepares Brain\Monkey for unit tests
 * that mock WordPress core functions (since unit tests don't load WP itself).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

require_once __DIR__ . '/../vendor/autoload.php';

// Stub the ABSPATH constant that every plugin source file checks.
// Without this, requiring a plugin source file in tests would die at the
// `defined( 'ABSPATH' ) || exit;` guard.
//
// The phpcs:ignore below is surgical: ABSPATH is a WordPress core constant
// name (not ours to rename), and this define() runs only in the test
// environment where WordPress itself has not bootstrapped. The PrefixAllGlobals
// rule is correct in the general case; this single line is the documented
// exception.
if ( ! defined( 'ABSPATH' ) ) {
	// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound
	define( 'ABSPATH', __DIR__ . '/' );
}

// Stub plugin-defined constants used by source files at parse time.
if ( ! defined( 'GOQW_VERSION' ) ) {
	define( 'GOQW_VERSION', '0.1.0' );
}
if ( ! defined( 'GOQW_PLUGIN_FILE' ) ) {
	define( 'GOQW_PLUGIN_FILE', __DIR__ . '/../quote-wizard.php' );
}
if ( ! defined( 'GOQW_PLUGIN_DIR' ) ) {
	define( 'GOQW_PLUGIN_DIR', __DIR__ . '/../' );
}
if ( ! defined( 'GOQW_PLUGIN_URL' ) ) {
	define( 'GOQW_PLUGIN_URL', 'http://example.test/wp-content/plugins/quote-wizard/' );
}
