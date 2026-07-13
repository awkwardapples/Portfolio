<?php
/**
 * Server-side Cloudflare Turnstile token verification (Step 5.13f).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Verifies a Turnstile token against Cloudflare's siteverify endpoint.
 *
 * See AUDIT-5.13f-turnstile-api.md for the full request/response contract
 * and Cloudflare's published test keys (used by this class's tests instead
 * of hitting the real endpoint — wp_remote_post is always mocked).
 */
class TurnstileClient {

	private const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

	/**
	 * Constructor.
	 *
	 * @param string $secret_key  Server-side Turnstile secret key.
	 */
	public function __construct( private readonly string $secret_key ) {}

	/**
	 * Verify a token with Cloudflare.
	 *
	 * @param  string $token      The token from the widget's callback.
	 * @param  string $remote_ip  Client IP (improves Cloudflare's risk signal).
	 * @return array{success: bool, errorCodes: list<string>}
	 */
	public function verify( string $token, string $remote_ip ): array {
		$response = wp_remote_post(
			self::VERIFY_URL,
			array(
				'body'    => array(
					'secret'   => $this->secret_key,
					'response' => $token,
					'remoteip' => $remote_ip,
				),
				'timeout' => 10,
			)
		);

		if ( is_wp_error( $response ) ) {
			return array(
				'success'    => false,
				'errorCodes' => array( 'network_error' ),
			);
		}

		$decoded = json_decode( (string) wp_remote_retrieve_body( $response ), true );

		if ( ! is_array( $decoded ) ) {
			return array(
				'success'    => false,
				'errorCodes' => array( 'invalid_response' ),
			);
		}

		$error_codes = isset( $decoded['error-codes'] ) && is_array( $decoded['error-codes'] )
			? array_values( array_map( 'strval', $decoded['error-codes'] ) )
			: array();

		return array(
			'success'    => isset( $decoded['success'] ) && true === $decoded['success'],
			'errorCodes' => $error_codes,
		);
	}
}
