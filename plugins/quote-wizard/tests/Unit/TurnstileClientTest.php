<?php
/**
 * Unit tests for TurnstileClient (Step 5.13f).
 *
 * wp_remote_post is always mocked — no test in this suite hits Cloudflare's
 * real endpoint. See AUDIT-5.13f-turnstile-api.md for the request/response
 * contract these tests assert against.
 *
 * is_wp_error() is never mocked here: it's a real function declared in
 * tests/bootstrap.php (`$thing instanceof WP_Error`), and Patchwork cannot
 * redefine a function that already exists before it loads. Tests instead
 * return a plain array (real is_wp_error() => false) or an actual WP_Error
 * instance (real is_wp_error() => true).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Support\TurnstileClient;
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
	'returns success for a valid token',
	function (): void {
		Functions\when( 'wp_remote_post' )->justReturn( array( 'body' => '{"success":true,"error-codes":[]}' ) );
		Functions\when( 'wp_remote_retrieve_body' )->alias(
			static fn ( array $response ): string => $response['body']
		);

		$result = ( new TurnstileClient( 'secret' ) )->verify( 'good-token', '1.2.3.4' );

		expect( $result['success'] )->toBeTrue();
		expect( $result['errorCodes'] )->toBeEmpty();
	}
);

it(
	'returns failure with error codes for an invalid token',
	function (): void {
		Functions\when( 'wp_remote_post' )->justReturn(
			array( 'body' => '{"success":false,"error-codes":["invalid-input-response"]}' )
		);
		Functions\when( 'wp_remote_retrieve_body' )->alias(
			static fn ( array $response ): string => $response['body']
		);

		$result = ( new TurnstileClient( 'secret' ) )->verify( 'bad-token', '1.2.3.4' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['errorCodes'] )->toBe( array( 'invalid-input-response' ) );
	}
);

it(
	'returns timeout-or-duplicate for an already-used token',
	function (): void {
		Functions\when( 'wp_remote_post' )->justReturn(
			array( 'body' => '{"success":false,"error-codes":["timeout-or-duplicate"]}' )
		);
		Functions\when( 'wp_remote_retrieve_body' )->alias(
			static fn ( array $response ): string => $response['body']
		);

		$result = ( new TurnstileClient( 'secret' ) )->verify( 'spent-token', '1.2.3.4' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['errorCodes'] )->toBe( array( 'timeout-or-duplicate' ) );
	}
);

it(
	'handles a network failure (wp_remote_post returns WP_Error) gracefully',
	function (): void {
		Functions\when( 'wp_remote_post' )->justReturn( new WP_Error( 'http_request_failed' ) );

		$result = ( new TurnstileClient( 'secret' ) )->verify( 'token', '1.2.3.4' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['errorCodes'] )->toBe( array( 'network_error' ) );
	}
);

it(
	'handles a malformed (non-JSON) response body gracefully',
	function (): void {
		Functions\when( 'wp_remote_post' )->justReturn( array( 'body' => 'not json' ) );
		Functions\when( 'wp_remote_retrieve_body' )->alias(
			static fn ( array $response ): string => $response['body']
		);

		$result = ( new TurnstileClient( 'secret' ) )->verify( 'token', '1.2.3.4' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['errorCodes'] )->toBe( array( 'invalid_response' ) );
	}
);
