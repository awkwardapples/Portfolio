<?php
/**
 * Unit tests for BotProtection (Step 5.13f).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Rest\BotProtection;
use Agency\QuoteWizard\Rest\RateLimiter;
use Agency\QuoteWizard\Support\TurnstileClient;
use Brain\Monkey;
use Brain\Monkey\Functions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Stub rate limiter with a fixed check() result and call recording.
 *
 * @param array{allowed: bool, remaining?: int, retryAfterSeconds?: int} $result
 */
function spy_rate_limiter( array $result = array( 'allowed' => true, 'remaining' => 5 ) ): object {
	return new class ( $result ) extends RateLimiter {
		/** @var list<string> */
		public array $recorded = [];

		/** @param array{allowed: bool, remaining?: int, retryAfterSeconds?: int} $result */
		public function __construct( private readonly array $result ) {}

		public function check( string $ip_address ): array {
			return $this->result;
		}

		public function record( string $ip_address ): void {
			$this->recorded[] = $ip_address;
		}
	};
}

/**
 * Stub Turnstile client with a fixed verify() result.
 *
 * @param array{success: bool, errorCodes: list<string>} $result
 */
function spy_turnstile_client( array $result ): object {
	return new class ( $result ) extends TurnstileClient {
		public array $calls = [];

		/** @param array{success: bool, errorCodes: list<string>} $result */
		public function __construct( private readonly array $result ) {}

		public function verify( string $token, string $remote_ip ): array {
			$this->calls[] = array( 'token' => $token, 'ip' => $remote_ip );
			return $this->result;
		}
	};
}

beforeEach(
	function (): void {
		Monkey\setUp();
		// BotProtection's constructor always consults Settings for whichever
		// dependency isn't explicitly injected (e.g. passing null for
		// $turnstile_client still calls Settings::turnstile_configured() to
		// decide whether to build a default one). Stub get_option() so every
		// Settings:: call resolves harmlessly; tests override behaviour via
		// explicit constructor arguments instead.
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => $default
		);
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

// ---------------------------------------------------------------------------
// Disabled config
// ---------------------------------------------------------------------------

it(
	'allows everything when bot protection is disabled, even a filled honeypot',
	function (): void {
		$protection = new BotProtection( spy_rate_limiter(), null, false );

		$result = $protection->check( array( 'honeypotValue' => 'im a bot' ), '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
	}
);

// ---------------------------------------------------------------------------
// Layer 1: honeypot
// ---------------------------------------------------------------------------

it(
	'rejects a filled honeypot before checking the rate limit',
	function (): void {
		$rate_limiter = spy_rate_limiter();
		$protection   = new BotProtection( $rate_limiter, null, true );

		$result = $protection->check( array( 'honeypotValue' => 'spam-bot-filled-this' ), '1.2.3.4' );

		expect( $result['allowed'] )->toBeFalse();
		expect( $result['errorCode'] )->toBe( 'honeypot_filled' );
		expect( $rate_limiter->recorded )->toBeEmpty();
	}
);

it(
	'proceeds past the honeypot check when it is empty',
	function (): void {
		$protection = new BotProtection( spy_rate_limiter(), null, true );

		$result = $protection->check( array( 'honeypotValue' => '' ), '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
	}
);

// ---------------------------------------------------------------------------
// Layer 2: rate limiting
// ---------------------------------------------------------------------------

it(
	'rejects a rate-limited IP with retryAfterSeconds',
	function (): void {
		$rate_limiter = spy_rate_limiter(
			array( 'allowed' => false, 'remaining' => 0, 'retryAfterSeconds' => 1800 )
		);
		$protection = new BotProtection( $rate_limiter, null, true );

		$result = $protection->check( array(), '1.2.3.4' );

		expect( $result['allowed'] )->toBeFalse();
		expect( $result['errorCode'] )->toBe( 'rate_limited' );
		expect( $result['retryAfterSeconds'] )->toBe( 1800 );
	}
);

// ---------------------------------------------------------------------------
// Layer 3: Turnstile (only when configured)
// ---------------------------------------------------------------------------

it(
	'allows the submission when Turnstile is not configured (null client)',
	function (): void {
		$rate_limiter = spy_rate_limiter();
		$protection   = new BotProtection( $rate_limiter, null, true );

		$result = $protection->check( array(), '1.2.3.4' );

		expect( $result['allowed'] )->toBeTrue();
		expect( $rate_limiter->recorded )->toBe( [ '1.2.3.4' ] );
	}
);

it(
	'rejects a missing Turnstile token when Turnstile is configured',
	function (): void {
		$rate_limiter = spy_rate_limiter();
		$turnstile    = spy_turnstile_client( array( 'success' => true, 'errorCodes' => [] ) );
		$protection   = new BotProtection( $rate_limiter, $turnstile, true );

		$result = $protection->check( array(), '1.2.3.4' );

		expect( $result['allowed'] )->toBeFalse();
		expect( $result['errorCode'] )->toBe( 'turnstile_missing' );
		expect( $turnstile->calls )->toBeEmpty();
		expect( $rate_limiter->recorded )->toBeEmpty();
	}
);

it(
	'rejects an invalid Turnstile token',
	function (): void {
		$rate_limiter = spy_rate_limiter();
		$turnstile    = spy_turnstile_client( array( 'success' => false, 'errorCodes' => [ 'invalid-input-response' ] ) );
		$protection   = new BotProtection( $rate_limiter, $turnstile, true );

		$result = $protection->check( array( 'turnstileToken' => 'bad-token' ), '1.2.3.4' );

		expect( $result['allowed'] )->toBeFalse();
		expect( $result['errorCode'] )->toBe( 'turnstile_invalid' );
		expect( $rate_limiter->recorded )->toBeEmpty();
	}
);

it(
	'allows and records the rate limit when the Turnstile token is valid',
	function (): void {
		$rate_limiter = spy_rate_limiter();
		$turnstile    = spy_turnstile_client( array( 'success' => true, 'errorCodes' => [] ) );
		$protection   = new BotProtection( $rate_limiter, $turnstile, true );

		$result = $protection->check( array( 'turnstileToken' => 'good-token' ), '9.9.9.9' );

		expect( $result['allowed'] )->toBeTrue();
		expect( $turnstile->calls )->toBe( [ [ 'token' => 'good-token', 'ip' => '9.9.9.9' ] ] );
		expect( $rate_limiter->recorded )->toBe( [ '9.9.9.9' ] );
	}
);

// ---------------------------------------------------------------------------
// Settings-driven defaults
// ---------------------------------------------------------------------------

it(
	'resolves enabled/turnstile/rate-limit defaults from Settings when not injected',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static function ( string $key, mixed $default = '' ): mixed {
				return match ( $key ) {
					'goqw_bot_protection_enabled' => false,
					default                        => $default,
				};
			}
		);

		$protection = new BotProtection();

		$result = $protection->check( array( 'honeypotValue' => 'bot' ), '1.2.3.4' );

		// bot_protection_enabled resolved to false from Settings, so even a
		// filled honeypot is allowed through.
		expect( $result['allowed'] )->toBeTrue();
	}
);
