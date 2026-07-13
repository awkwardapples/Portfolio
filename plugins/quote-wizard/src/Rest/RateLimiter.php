<?php
/**
 * Per-IP submission rate limiting (Step 5.13f).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

defined( 'ABSPATH' ) || exit;

/**
 * Tracks successful submission counts per IP using WordPress transients.
 *
 * The transient value stores both the count and the window's absolute expiry
 * timestamp — `retryAfterSeconds` is computed from that stored timestamp
 * rather than by reading WordPress's internal `_transient_timeout_*` option,
 * which is an implementation detail that doesn't exist at all when an
 * external persistent object cache is active (transients delegate entirely
 * to the object cache in that case). Storing the expiry ourselves keeps
 * `check()` correct regardless of the transient backend.
 *
 * `record()` is called only after every other bot-protection layer has
 * already passed (see BotProtection::check()) — this counts successful
 * submissions per hour, not raw attempts. A honeypot-triggered request never
 * increments the counter.
 */
class RateLimiter {

	private const TRANSIENT_PREFIX = 'goqw_rate_limit_';

	/**
	 * Constructor.
	 *
	 * @param int $limit           Max submissions allowed per window.
	 * @param int $window_seconds  Window length in seconds (default: 1 hour).
	 */
	public function __construct(
		private readonly int $limit,
		private readonly int $window_seconds = HOUR_IN_SECONDS,
	) {}

	/**
	 * Check whether this IP is currently within its rate limit.
	 *
	 * @param  string $ip_address  Client IP address.
	 * @return array{allowed: bool, remaining: int, retryAfterSeconds?: int}
	 */
	public function check( string $ip_address ): array {
		$entry = $this->read( $ip_address );

		if ( null === $entry ) {
			return array(
				'allowed'   => true,
				'remaining' => $this->limit,
			);
		}

		if ( $entry['count'] < $this->limit ) {
			return array(
				'allowed'   => true,
				'remaining' => $this->limit - $entry['count'],
			);
		}

		return array(
			'allowed'           => false,
			'remaining'         => 0,
			'retryAfterSeconds' => max( 0, $entry['expires_at'] - time() ),
		);
	}

	/**
	 * Record a successful submission from this IP.
	 *
	 * @param string $ip_address  Client IP address.
	 */
	public function record( string $ip_address ): void {
		$entry = $this->read( $ip_address );

		if ( null === $entry ) {
			$expires_at = time() + $this->window_seconds;
			set_transient(
				$this->transient_key( $ip_address ),
				array(
					'count'      => 1,
					'expires_at' => $expires_at,
				),
				$this->window_seconds
			);
			return;
		}

		// Preserve the original window's expiry; only the count advances.
		$remaining_ttl = max( 1, $entry['expires_at'] - time() );
		set_transient(
			$this->transient_key( $ip_address ),
			array(
				'count'      => $entry['count'] + 1,
				'expires_at' => $entry['expires_at'],
			),
			$remaining_ttl
		);
	}

	/**
	 * Read the current entry for an IP, or null if none exists (fresh IP, or
	 * the window naturally expired and the transient was garbage-collected).
	 *
	 * @param  string $ip_address  Client IP address.
	 * @return array{count: int, expires_at: int}|null
	 */
	private function read( string $ip_address ): ?array {
		$value = get_transient( $this->transient_key( $ip_address ) );

		if ( ! is_array( $value ) || ! isset( $value['count'], $value['expires_at'] ) ) {
			return null;
		}

		return array(
			'count'      => (int) $value['count'],
			'expires_at' => (int) $value['expires_at'],
		);
	}

	/**
	 * Build the transient key for an IP. Hashed so IPv6 addresses (which
	 * contain colons and can be long) never affect the option name shape.
	 *
	 * @param string $ip_address  Client IP address.
	 */
	private function transient_key( string $ip_address ): string {
		return self::TRANSIENT_PREFIX . md5( $ip_address );
	}
}
