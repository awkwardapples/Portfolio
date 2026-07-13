<?php
/**
 * Unit tests for the Settings class.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Support\Settings;
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
	'returns the wp_options value when no constant is defined',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static function ( string $key, string $default_value = '' ): string {
				return 'goqw_webhook_url' === $key
					? 'https://hook.eu1.make.com/abc123'
					: $default_value;
			}
		);

		expect( Settings::webhook_url() )->toBe( 'https://hook.eu1.make.com/abc123' );
	}
);

it(
	'returns the empty default when neither constant nor option is set',
	function (): void {
		Functions\when( 'get_option' )->justReturn( '' );

		expect( Settings::webhook_url() )->toBe( '' );
	}
);

it(
	'exposes a public config that excludes sensitive values',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static function ( string $key, string $default_value = '' ): string {
				return match ( $key ) {
					'goqw_business_name'  => 'Test Fencing',
					'goqw_business_phone' => '01234 567890',
					'goqw_business_email' => 'hello@test.test',
					'goqw_primary_color'  => '#FF0000',
					'goqw_calendly_url'   => 'https://calendly.com/test',
					default               => $default_value,
				};
			}
		);

		$public = Settings::public_config();

		expect( $public )->toHaveKeys(
			array( 'businessName', 'businessPhone', 'businessEmail', 'primaryColor', 'calendlyUrl' )
		);

		// The public config must never include sensitive fields.
		expect( $public )->not->toHaveKey( 'webhookUrl' );
		expect( $public )->not->toHaveKey( 'webhook_url' );
		expect( $public )->not->toHaveKey( 'agencyNotificationEmail' );

		expect( $public['businessName'] )->toBe( 'Test Fencing' );
		expect( $public['primaryColor'] )->toBe( '#FF0000' );
	}
);

// ---------------------------------------------------------------------------
// Bot protection settings (Step 5.13f)
// ---------------------------------------------------------------------------

it(
	'bot_protection_enabled defaults to true when the option is absent',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = false ): mixed => $default
		);

		expect( Settings::bot_protection_enabled() )->toBeTrue();
	}
);

it(
	'bot_protection_enabled reflects an explicit false option value',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = false ): mixed => 'goqw_bot_protection_enabled' === $key ? '0' : $default
		);

		expect( Settings::bot_protection_enabled() )->toBeFalse();
	}
);

it(
	'turnstile_site_key returns the configured option value',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => 'goqw_turnstile_site_key' === $key ? '0x4AAAAAAD08xGwhMXvPs1CQ' : $default
		);

		expect( Settings::turnstile_site_key() )->toBe( '0x4AAAAAAD08xGwhMXvPs1CQ' );
	}
);

it(
	'turnstile_secret_key returns the wp_options value when no constant is defined',
	function (): void {
		// Note: the constant-precedence path (GOQW_TURNSTILE_SECRET_KEY) is not
		// exercised here — PHP constants cannot be undefined once set within a
		// test process, so defining one would leak into every later test that
		// calls turnstile_secret_key()/turnstile_configured(). webhook_url()'s
		// equivalent constant path (GOQW_MAKE_WEBHOOK_URL) is untested for the
		// same reason; this follows the same established restraint.
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => 'goqw_turnstile_secret_key' === $key ? 'from-option' : $default
		);

		expect( Settings::turnstile_secret_key() )->toBe( 'from-option' );
	}
);

it(
	'turnstile_configured is false when only the site key is set',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => 'goqw_turnstile_site_key' === $key ? 'sitekey' : $default
		);

		expect( Settings::turnstile_configured() )->toBeFalse();
	}
);

it(
	'rate_limit_per_hour defaults to 5',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = 0 ): mixed => $default
		);

		expect( Settings::rate_limit_per_hour() )->toBe( 5 );
	}
);
