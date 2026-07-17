<?php
/**
 * Synchronous forwarder to the Make.com webhook (ADR-0005).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Sends a persisted submission to the configured Make.com webhook.
 *
 * Design contract (ADR-0005):
 *   - Forward is synchronous — the caller blocks until a result is known.
 *   - A non-2xx HTTP response or any transport error is a forward failure.
 *   - Forward failure returns ForwardResult::failure(); the submission IS
 *     already persisted by this point — data is never lost.
 *   - The webhook URL is server-side only (ADR-0007): GOQW_MAKE_WEBHOOK_URL
 *     constant (wp-config.php) takes precedence over the goqw_webhook_url option.
 */
class Forwarder {

	private const TIMEOUT_SECONDS = 10;

	/**
	 * Forward a persisted submission to the Make.com webhook.
	 *
	 * A missing webhook URL is treated as a failure, not a fatal error.
	 * The submission is already durably stored; the admin must configure
	 * the URL to enable forwarding.
	 *
	 * @param int                 $submission_id  Row ID of the persisted submission.
	 * @param array<string,mixed> $payload        Validated payload from the controller.
	 */
	public function forward( int $submission_id, array $payload ): ForwardResult {
		$webhook_url = $this->resolve_webhook_url();

		if ( '' === $webhook_url ) {
			return ForwardResult::failure( 'webhook_not_configured' );
		}

		$body = \wp_json_encode(
			array(
				'submission_id'    => $submission_id,
				'wizard_id'        => $payload['wizard_id'],
				'schema_version'   => $payload['schema_version'],
				'quote_mode'       => $payload['quote_mode'] ?? 'instant',
				'answers'          => json_decode( $payload['answers_json'], true ),
				'pricing'          => null !== $payload['pricing_json']
					? json_decode( $payload['pricing_json'], true )
					: null,
				'media'            => isset( $payload['media_json'] ) && null !== $payload['media_json']
					? json_decode( $payload['media_json'], true )
					: null,
				'client_timestamp' => $payload['client_timestamp'],
			)
		);

		$response = \wp_remote_post(
			$webhook_url,
			array(
				'method'  => 'POST',
				'timeout' => self::TIMEOUT_SECONDS,
				'headers' => array( 'Content-Type' => 'application/json' ),
				'body'    => $body,
			)
		);

		if ( \is_wp_error( $response ) ) {
			return ForwardResult::failure( 'transport_error: ' . $response->get_error_message() );
		}

		$code = (int) \wp_remote_retrieve_response_code( $response );

		if ( $code < 200 || $code >= 300 ) {
			return ForwardResult::failure( sprintf( 'http_status_%d', $code ) );
		}

		return ForwardResult::success();
	}

	/**
	 * Return the webhook URL from constant or option (constant wins).
	 */
	private function resolve_webhook_url(): string {
		if ( defined( 'GOQW_MAKE_WEBHOOK_URL' ) && '' !== GOQW_MAKE_WEBHOOK_URL ) {
			return (string) GOQW_MAKE_WEBHOOK_URL;
		}

		return (string) \get_option( 'goqw_webhook_url', '' );
	}
}
