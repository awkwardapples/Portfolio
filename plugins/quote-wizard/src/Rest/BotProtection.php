<?php
/**
 * Three-layer bot/spam protection middleware (Step 5.13f, ADR-0027).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

use Agency\QuoteWizard\Support\Logger;
use Agency\QuoteWizard\Support\Settings;
use Agency\QuoteWizard\Support\TurnstileClient;

defined( 'ABSPATH' ) || exit;

/**
 * Runs honeypot, rate-limit, and Turnstile checks (in that order — cheapest
 * first, same principle MediaValidator already applies to its own checks)
 * before a submission is allowed to proceed to shape validation.
 *
 * Wire contract: the raw JSON payload carries `honeypotValue` (string,
 * expected empty) and `turnstileToken` (string, present when Turnstile is
 * configured for this deployment). These are camelCase top-level keys,
 * matching this codebase's existing wire-contract convention
 * (`wizardId`, `quoteMode`, `clientTimestamp`) — the spec's own pseudo-code
 * used snake_case (`website_field`, `turnstile_token`); this is a deliberate
 * deviation, not an oversight.
 *
 * Turnstile verification only runs when both keys are configured
 * (Settings::turnstile_configured()) — a deployment that hasn't set up
 * Cloudflare yet still gets honeypot + rate limiting.
 *
 * rate_limiter->record() is called only once every layer has passed, so the
 * rate limit counts successful submissions, not raw attempts (a honeypot
 * failure never consumes a slot).
 */
class BotProtection {

	/**
	 * Resolved rate limiter (injected or Settings-driven default).
	 *
	 * @var RateLimiter
	 */
	private readonly RateLimiter $rate_limiter;

	/**
	 * Null when Turnstile is not configured for this deployment.
	 *
	 * @var TurnstileClient|null
	 */
	private readonly ?TurnstileClient $turnstile_client;

	/**
	 * Master switch — false disables every layer.
	 *
	 * @var bool
	 */
	private readonly bool $enabled;

	/**
	 * Constructor.
	 *
	 * All three dependencies default to their Settings-driven production
	 * values but are injectable so tests never need to mock get_option().
	 *
	 * @param RateLimiter|null     $rate_limiter      Defaults to Settings::rate_limit_per_hour().
	 * @param TurnstileClient|null $turnstile_client   Defaults to null unless Settings::turnstile_configured().
	 * @param bool|null            $enabled            Defaults to Settings::bot_protection_enabled().
	 */
	public function __construct(
		?RateLimiter $rate_limiter = null,
		?TurnstileClient $turnstile_client = null,
		?bool $enabled = null
	) {
		$this->rate_limiter     = $rate_limiter ?? new RateLimiter( Settings::rate_limit_per_hour() );
		$this->turnstile_client = $turnstile_client ?? ( Settings::turnstile_configured()
			? new TurnstileClient( Settings::turnstile_secret_key() )
			: null );
		$this->enabled          = $enabled ?? Settings::bot_protection_enabled();
	}

	/**
	 * Check a submission against all configured bot-protection layers.
	 *
	 * @param  array<string,mixed> $submission_data  Raw decoded JSON payload.
	 * @param  string              $ip_address       Client IP (ClientIp::resolve()).
	 * @return array{allowed: bool, errorCode?: string, retryAfterSeconds?: int}
	 */
	public function check( array $submission_data, string $ip_address ): array {
		if ( ! $this->enabled ) {
			return array( 'allowed' => true );
		}

		// Layer 1: honeypot. A real user never populates this field.
		if ( '' !== (string) ( $submission_data['honeypotValue'] ?? '' ) ) {
			Logger::operational( 'honeypot filled', array( 'ip' => $ip_address ) );
			return array(
				'allowed'   => false,
				'errorCode' => 'honeypot_filled',
			);
		}

		// Layer 2: rate limiting.
		$rate_check = $this->rate_limiter->check( $ip_address );
		if ( ! $rate_check['allowed'] ) {
			return array(
				'allowed'           => false,
				'errorCode'         => 'rate_limited',
				'retryAfterSeconds' => $rate_check['retryAfterSeconds'] ?? 0,
			);
		}

		// Layer 3: Turnstile verification, only when configured.
		if ( null !== $this->turnstile_client ) {
			$token = (string) ( $submission_data['turnstileToken'] ?? '' );

			if ( '' === $token ) {
				return array(
					'allowed'   => false,
					'errorCode' => 'turnstile_missing',
				);
			}

			$verify_result = $this->turnstile_client->verify( $token, $ip_address );
			if ( ! $verify_result['success'] ) {
				return array(
					'allowed'   => false,
					'errorCode' => 'turnstile_invalid',
				);
			}
		}

		$this->rate_limiter->record( $ip_address );
		return array( 'allowed' => true );
	}
}
