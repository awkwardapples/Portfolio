<?php
/**
 * Unit tests for RateLimiter (Step 5.13f).
 *
 * A tiny in-memory map stands in for the transients API so get_transient()/
 * set_transient() behave like the real thing within a single test, without
 * needing a database.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Rest\RateLimiter;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Wire get_transient()/set_transient() to a plain array for this test.
 *
 * @param array<string,mixed> $store  Reference to the fake transient store.
 */
function fake_transients( array &$store ): void {
	Functions\when( 'get_transient' )->alias(
		static function ( string $key ) use ( &$store ): mixed {
			return $store[ $key ] ?? false;
		}
	);
	Functions\when( 'set_transient' )->alias(
		static function ( string $key, mixed $value, int $expiration ) use ( &$store ): bool {
			$store[ $key ] = $value;
			return true;
		}
	);
}

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
	'allows a fresh IP with no prior transient',
	function (): void {
		$store = [];
		fake_transients( $store );

		$result = ( new RateLimiter( 5 ) )->check( '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
		expect( $result['remaining'] )->toBe( 5 );
	}
);

it(
	'allows an IP under the limit and reports remaining count',
	function (): void {
		$store  = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 5 );

		$limiter->record( '1.2.3.4' );
		$limiter->record( '1.2.3.4' );

		$result = $limiter->check( '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
		expect( $result['remaining'] )->toBe( 3 );
	}
);

it(
	'denies an IP at the limit with a positive retryAfterSeconds',
	function (): void {
		$store   = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 2 );

		$limiter->record( '1.2.3.4' );
		$limiter->record( '1.2.3.4' );

		$result = $limiter->check( '1.2.3.4' );

		expect( $result['allowed'] )->toBeFalse();
		expect( $result['remaining'] )->toBe( 0 );
		expect( $result['retryAfterSeconds'] )->toBeGreaterThan( 0 );
	}
);

it(
	'tracks independent counters for different IPs',
	function (): void {
		$store   = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 1 );

		$limiter->record( '1.1.1.1' );

		expect( $limiter->check( '1.1.1.1' )['allowed'] )->toBeFalse();
		expect( $limiter->check( '2.2.2.2' )['allowed'] )->toBeTrue();
	}
);

it(
	'preserves the original window expiry across multiple record() calls',
	function (): void {
		$store   = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 10, 3600 );

		$limiter->record( '1.2.3.4' );
		$first_expiry = $store[ array_key_first( $store ) ]['expires_at'];

		$limiter->record( '1.2.3.4' );
		$second_expiry = $store[ array_key_first( $store ) ]['expires_at'];

		expect( $second_expiry )->toBe( $first_expiry );
	}
);

it(
	'treats a missing transient as a naturally expired window (allowed again)',
	function (): void {
		$store = []; // Simulates the transient having expired and been garbage-collected.
		fake_transients( $store );

		$result = ( new RateLimiter( 5 ) )->check( '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
		expect( $result['remaining'] )->toBe( 5 );
	}
);

it(
	'does not increment the count when checking, only when recording',
	function (): void {
		$store   = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 5 );

		$limiter->check( '1.2.3.4' );
		$limiter->check( '1.2.3.4' );
		$limiter->check( '1.2.3.4' );

		expect( $store )->toBeEmpty();
	}
);

it(
	'uses the configured window length for a fresh record',
	function (): void {
		$store   = [];
		fake_transients( $store );
		$limiter = new RateLimiter( 5, 1800 );

		$before = time();
		$limiter->record( '1.2.3.4' );
		$entry = $store[ array_key_first( $store ) ];

		expect( $entry['expires_at'] )->toBeGreaterThanOrEqual( $before + 1800 );
		expect( $entry['expires_at'] )->toBeLessThanOrEqual( $before + 1802 );
	}
);
