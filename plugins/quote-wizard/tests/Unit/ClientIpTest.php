<?php
/**
 * Unit tests for ClientIp (Step 5.13f).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Rest\ClientIp;
use Brain\Monkey;
use Brain\Monkey\Functions;

beforeEach(
	function (): void {
		Monkey\setUp();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_unslash' )->returnArg();
	}
);

afterEach(
	function (): void {
		unset( $_SERVER['REMOTE_ADDR'] );
		Monkey\tearDown();
	}
);

it(
	'resolves REMOTE_ADDR when present',
	function (): void {
		$_SERVER['REMOTE_ADDR'] = '203.0.113.42';

		expect( ClientIp::resolve() )->toBe( '203.0.113.42' );
	}
);

it(
	'returns an empty string when REMOTE_ADDR is not set',
	function (): void {
		unset( $_SERVER['REMOTE_ADDR'] );

		expect( ClientIp::resolve() )->toBe( '' );
	}
);
