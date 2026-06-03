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

// WordPress time constants used by plugin source files.
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound
if ( ! defined( 'MINUTE_IN_SECONDS' ) ) {
	define( 'MINUTE_IN_SECONDS', 60 );
}
if ( ! defined( 'HOUR_IN_SECONDS' ) ) {
	define( 'HOUR_IN_SECONDS', 3600 );
}
if ( ! defined( 'DAY_IN_SECONDS' ) ) {
	define( 'DAY_IN_SECONDS', 86400 );
}
if ( ! defined( 'WEEK_IN_SECONDS' ) ) {
	define( 'WEEK_IN_SECONDS', 604800 );
}
if ( ! defined( 'REST_REQUEST' ) ) {
	define( 'REST_REQUEST', false );
}
if ( ! defined( 'DOING_CRON' ) ) {
	define( 'DOING_CRON', false );
}
if ( ! defined( 'WP_CLI' ) ) {
	define( 'WP_CLI', false );
}
// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound

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

// ---------------------------------------------------------------------------
// WordPress class stubs.
//
// Unit tests run without WordPress loaded. These minimal stubs satisfy type
// checks and provide the handful of methods that plugin source code calls on
// these classes. Brain\Monkey stubs the global functions; these stubs handle
// the class-based WP API.
// ---------------------------------------------------------------------------

// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals

if ( ! class_exists( 'WP_REST_Response' ) ) {
	class WP_REST_Response {
		public function __construct(
			private readonly mixed $data = null,
			private readonly int $status = 200
		) {}
		public function get_data(): mixed { return $this->data; }
		public function get_status(): int { return $this->status; }
	}
}

if ( ! class_exists( 'WP_Error' ) ) {
	class WP_Error {
		/** @var string[] */
		private array $codes = [];
		public function __construct( string $code = '', string $message = '', mixed $data = '' ) {
			$this->codes[] = $code;
		}
		public function get_error_code(): string { return $this->codes[0] ?? ''; }
		public function get_error_message(): string { return ''; }
	}
	function is_wp_error( mixed $thing ): bool { return $thing instanceof WP_Error; }
}

if ( ! class_exists( 'WP_REST_Request' ) ) {
	class WP_REST_Request {}
}

if ( ! class_exists( 'WP_Post' ) ) {
	class WP_Post {
		public int $ID = 0;
		public string $post_status = 'publish';
		public string $post_type = 'page';
		public string $post_name = '';
	}
}

if ( ! class_exists( 'WP_Query' ) ) {
	class WP_Query {
		public bool $is_home = true;
		public bool $is_page = false;
		public bool $is_singular = false;
		private bool $main_query = true;
		public function is_main_query(): bool { return $this->main_query; }
		public function set_as_secondary(): void { $this->main_query = false; }
		public function set( string $key, mixed $value ): void {
			$this->$key = $value;
		}
	}
}

// phpcs:enable WordPress.NamingConventions.PrefixAllGlobals
