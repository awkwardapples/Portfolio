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
