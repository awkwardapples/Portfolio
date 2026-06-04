<?php
/**
 * REST controller for POST /wp-json/qw/v1/submit.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

use Agency\QuoteWizard\Submissions\Forwarder;
use Agency\QuoteWizard\Submissions\MediaValidator;
use Agency\QuoteWizard\Submissions\SubmissionRepository;
use Agency\QuoteWizard\Support\Logger;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

defined( 'ABSPATH' ) || exit;

/**
 * Handles wizard submission requests (ADR-0001, ADR-0005, ADR-0015).
 *
 * Strict ordering — every request follows exactly these steps:
 *   1. Validate nonce + payload shape. On failure → 400, nothing persisted.
 *   2. INSERT into wp_goqw_submissions (status = 'persisted').
 *      On failure → 500, NO forward attempted.
 *   3. Forward to Make.com webhook synchronously.
 *      On failure → update row to 'forward_failed', return 502.
 *   4. Update row to 'forwarded', return 200 { reference }.
 *
 * The 502 response body carries { errorCode, submissionId } so the frontend
 * can display an operational message ("your data is safe, please retry").
 */
final class SubmissionController {

	/**
	 * Constructor.
	 *
	 * @param SubmissionRepository $repository      Data-access layer for submissions.
	 * @param Forwarder            $forwarder        Webhook forwarder.
	 * @param MediaValidator       $media_validator  Photo upload validator.
	 */
	public function __construct(
		private readonly SubmissionRepository $repository,
		private readonly Forwarder $forwarder,
		private readonly MediaValidator $media_validator = new MediaValidator()
	) {}

	/**
	 * Handle a POST /wp-json/qw/v1/submit request.
	 *
	 * @param WP_REST_Request $request  The incoming REST request.
	 */
	public function handle( WP_REST_Request $request ): WP_REST_Response {
		// Step 1: validate.
		$payload   = $request->get_json_params();
		$validated = $this->validate( $payload );

		if ( $validated instanceof WP_Error ) {
			return new WP_REST_Response(
				array( 'errorCode' => 'validation_failed' ),
				400
			);
		}

		// Step 1b: validate media entries (photo fields) before persisting.
		$media_result = $this->media_validator->validate(
			is_array( $payload['answers'] ?? null ) ? $payload['answers'] : array()
		);
		if ( ! $media_result['ok'] ) {
			return new WP_REST_Response(
				array(
					'errorCode'   => 'media_validation_failed',
					'mediaIssues' => $media_result['issues'],
				),
				400
			);
		}

		// Step 2: persist durably (must succeed before any forward attempt).
		try {
			$submission_id = $this->repository->insert( $validated );
		} catch ( \Throwable $e ) {
			Logger::operational( 'submission persist failed: ' . $e->getMessage() );
			return new WP_REST_Response(
				array( 'errorCode' => 'persistence_failed' ),
				500
			);
		}

		// Step 3: forward synchronously (ADR-0005).
		$forward_result = $this->forwarder->forward( $submission_id, $validated );

		// Step 4: respond.
		if ( $forward_result->is_success() ) {
			$this->repository->mark_forwarded( $submission_id );
			return new WP_REST_Response(
				array( 'reference' => $this->reference_for( $submission_id ) ),
				200
			);
		}

		$this->repository->mark_forward_failed( $submission_id, $forward_result->error_message() );
		Logger::operational(
			sprintf(
				'submission %d persisted but forward failed: %s',
				$submission_id,
				$forward_result->error_message()
			)
		);

		return new WP_REST_Response(
			array(
				'errorCode'    => 'forwarder_unavailable',
				'submissionId' => $submission_id,
			),
			502
		);
	}

	/**
	 * Validate and sanitise the raw JSON payload.
	 *
	 * Returns a normalised array on success, WP_Error on failure.
	 * Error details are intentionally not forwarded to the client.
	 *
	 * @param  mixed $payload  Decoded JSON body from the request.
	 * @return array<string,mixed>|WP_Error
	 */
	private function validate( mixed $payload ): array|WP_Error {
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'invalid_payload', 'Payload must be a JSON object.' );
		}

		if ( ( $payload['contractVersion'] ?? null ) !== 2 ) {
			return new WP_Error( 'contract_version', 'Contract version mismatch.' );
		}

		$wizard_id = $payload['wizardId'] ?? null;
		if ( ! is_string( $wizard_id ) || '' === $wizard_id ) {
			return new WP_Error( 'wizard_id', 'wizardId is required.' );
		}

		$answers = $payload['answers'] ?? null;
		if ( ! is_array( $answers ) ) {
			return new WP_Error( 'answers', 'answers must be an object.' );
		}

		$pricing = null;
		if ( isset( $payload['pricing'] ) && is_array( $payload['pricing'] ) ) {
			$p = $payload['pricing'];
			if (
				isset( $p['totalPence'], $p['lowPence'], $p['highPence'], $p['currency'] )
				&& is_int( $p['totalPence'] )
				&& is_int( $p['lowPence'] )
				&& is_int( $p['highPence'] )
				&& 'GBP' === $p['currency']
			) {
				$pricing = array(
					'totalPence' => $p['totalPence'],
					'lowPence'   => $p['lowPence'],
					'highPence'  => $p['highPence'],
					'currency'   => 'GBP',
				);
			}
		}

		$client_ts = $payload['clientTimestamp'] ?? '';
		if ( ! is_string( $client_ts ) ) {
			$client_ts = '';
		}

		return array(
			'wizard_id'        => sanitize_key( $wizard_id ),
			'schema_version'   => isset( $payload['schemaVersion'] ) && is_int( $payload['schemaVersion'] )
				? $payload['schemaVersion']
				: 1,
			'answers_json'     => wp_json_encode( $answers ),
			'pricing_json'     => null !== $pricing ? wp_json_encode( $pricing ) : null,
			'media_json'       => $this->extract_media_json( $answers ),
			'client_timestamp' => sanitize_text_field( $client_ts ),
		);
	}

	/**
	 * Extract the media (photo) entries from the answers map and encode as JSON.
	 *
	 * Returns null when no photo fields are present, so the media_json column
	 * is NULL for non-photo submissions (routine row reads skip it).
	 *
	 * @param  array<string,mixed> $answers  Decoded answers.
	 * @return string|null  JSON-encoded media array, or null.
	 */
	private function extract_media_json( array $answers ): ?string {
		$media = array();
		foreach ( $answers as $field_key => $value ) {
			if ( is_array( $value ) && isset( $value['files'] ) && is_array( $value['files'] ) ) {
				$media[] = array(
					'fieldKey' => (string) $field_key,
					'files'    => $value['files'],
				);
			}
		}
		return empty( $media ) ? null : wp_json_encode( $media );
	}

	/**
	 * Return a human-readable submission reference string.
	 *
	 * @param int $submission_id  Database row ID.
	 */
	private function reference_for( int $submission_id ): string {
		return sprintf( 'GOQW-%d', $submission_id );
	}
}
