<?php
/**
 * Unit tests for PublicConfig::build().
 *
 * Asserts the v2 contract shape: contractVersion = 2 and wizardId present.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Frontend\PublicConfig;
use Brain\Monkey;
use Brain\Monkey\Functions;

beforeEach(
	function (): void {
		Monkey\setUp();
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

it(
	'emits contractVersion 2 in the public config',
	function (): void {
		Functions\when( 'get_option' )->justReturn( '' );
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'rest_url' )->justReturn( 'https://example.test/wp-json/qw/v1' );
		Functions\when( 'wp_create_nonce' )->justReturn( 'test-nonce' );

		$config = PublicConfig::build();

		expect( $config['contractVersion'] )->toBe( 2 );
	}
);

it(
	'emits wizardId from the goqw_wizard_id option',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static function ( string $key, string $default = '' ): string {
				return 'goqw_wizard_id' === $key ? 'fencing' : $default;
			}
		);
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'rest_url' )->justReturn( 'https://example.test/wp-json/qw/v1' );
		Functions\when( 'wp_create_nonce' )->justReturn( 'test-nonce' );

		$config = PublicConfig::build();

		expect( $config['wizardId'] )->toBe( 'fencing' );
	}
);

it(
	'falls back to fencing when goqw_wizard_id option is absent',
	function (): void {
		Functions\when( 'get_option' )->justReturn( '' );
		Functions\when( 'esc_url_raw' )->returnArg();
		Functions\when( 'rest_url' )->justReturn( 'https://example.test/wp-json/qw/v1' );
		Functions\when( 'wp_create_nonce' )->justReturn( 'test-nonce' );

		$config = PublicConfig::build();

		expect( $config['wizardId'] )->toBe( 'fencing' );
	}
);
