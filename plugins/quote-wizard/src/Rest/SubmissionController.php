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
use Agency\QuoteWizard\Submissions\PhotoStorage;
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
	 * @param PhotoStorage         $photo_storage    Saves validated photos to the media library (Step 5.13e).
	 */
	public function __construct(
		private readonly SubmissionRepository $repository,
		private readonly Forwarder $forwarder,
		private readonly MediaValidator $media_validator = new MediaValidator(),
		private readonly PhotoStorage $photo_storage = new PhotoStorage()
	) {}

	/**
	 * Handle a POST /wp-json/qw/v1/submit request.
	 *
	 * @param WP_REST_Request $request  The incoming REST request.
	 */
	public function handle( WP_REST_Request $request ): WP_REST_Response {
		// Buffer any output that leaks during the request (e.g., PHP warnings
		// from WP_DEBUG_DISPLAY=true) so it does not corrupt the JSON response
		// body. The buffer is discarded unconditionally in the finally block.
		ob_start();
		try {
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
			// Runs against the raw base64 answers — PhotoStorage (step 1c) must not
			// run first, or magic-byte/dimension checks would have nothing to check
			// (AUDIT-5.13e-media-validator.md).
			$answers      = $validated['answers'];
			$media_result = $this->media_validator->validate( $answers );
			if ( ! $media_result['ok'] ) {
				return new WP_REST_Response(
					array(
						'errorCode'   => 'media_validation_failed',
						'mediaIssues' => $media_result['issues'],
					),
					400
				);
			}

			// Step 1c: save validated photos to the media library, replacing
			// dataBase64 with a public URL + attachmentId in the answers (D2).
			// A per-photo storage failure does not block the submission — the
			// failing photo is dropped and logged, submission continues (D5).
			$photo_result = $this->store_photos( $answers );
			$answers      = $photo_result['answers'];

			$validated['answers_json'] = wp_json_encode( $answers );
			$validated['media_json']   = $this->extract_media_json( $answers );
			unset( $validated['answers'] );

			// Step 2: persist durably (must succeed before any forward attempt).
			try {
				$submission_id = $this->repository->insert( $validated );
			} catch ( \Throwable $e ) {
				Logger::operational( 'submission persist failed: ' . $e->getMessage() );
				// D6: the submission row never existed, so any photos already
				// saved to the media library for it are orphaned. Delete them.
				$this->cleanup_orphaned_photos( $photo_result['attachmentIds'] );
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
		} finally {
			ob_end_clean();
		}
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

		if ( ( $payload['contractVersion'] ?? null ) !== 3 ) {
			return new WP_Error( 'contract_version', 'Contract version mismatch.' );
		}

		$quote_mode = $payload['quoteMode'] ?? null;
		if ( ! in_array( $quote_mode, array( 'instant', 'manual' ), true ) ) {
			return new WP_Error( 'quote_mode', 'quoteMode must be instant or manual.' );
		}

		$wizard_id = $payload['wizardId'] ?? null;
		if ( ! is_string( $wizard_id ) || '' === $wizard_id ) {
			return new WP_Error( 'wizard_id', 'wizardId is required.' );
		}

		$answers = $payload['answers'] ?? null;
		if ( ! is_array( $answers ) ) {
			return new WP_Error( 'answers', 'answers must be an object.' );
		}

		// For 'manual' quoteMode the pricing block is not expected and is ignored
		// even if present. For 'instant', pricing is validated when supplied.
		$pricing = null;
		if ( 'instant' === $quote_mode && isset( $payload['pricing'] ) && is_array( $payload['pricing'] ) ) {
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
			'quote_mode'       => $quote_mode,
			// Plain array, not yet JSON-encoded: store_photos() must mutate this
			// (replacing dataBase64 with url/attachmentId) before answers_json
			// and media_json are derived from it. See handle().
			'answers'          => $answers,
			'pricing_json'     => null !== $pricing ? wp_json_encode( $pricing ) : null,
			'client_timestamp' => sanitize_text_field( $client_ts ),
		);
	}

	/**
	 * Save every photo file in the answers map to the media library, replacing
	 * dataBase64 with a public URL + attachmentId (Step 5.13e, D2). A file that
	 * fails to store is dropped from its field's files array and logged; it
	 * never blocks the rest of the submission (D5).
	 *
	 * @param  array<string,mixed> $answers  Decoded, already media-validated answers.
	 * @return array{answers: array<string,mixed>, attachmentIds: list<int>}
	 */
	private function store_photos( array $answers ): array {
		$attachment_ids = array();

		foreach ( $answers as $field_key => $value ) {
			if ( ! is_array( $value ) || ! isset( $value['files'] ) || ! is_array( $value['files'] ) ) {
				continue;
			}

			$stored_files = array();
			foreach ( $value['files'] as $file ) {
				if ( ! is_array( $file ) || ! isset( $file['dataBase64'] ) ) {
					continue;
				}

				$result = $this->photo_storage->store_photo(
					(string) $file['dataBase64'],
					isset( $file['mimeType'] ) ? (string) $file['mimeType'] : '',
					isset( $file['originalName'] ) ? (string) $file['originalName'] : ''
				);

				if ( ! $result['success'] ) {
					Logger::operational(
						sprintf(
							'photo storage failed for field "%s": %s',
							(string) $field_key,
							$result['error'] ?? 'unknown'
						)
					);
					continue;
				}

				$stored_file = $file;
				unset( $stored_file['dataBase64'] );
				$stored_file['url']          = $result['url'];
				$stored_file['attachmentId'] = $result['attachmentId'];

				$stored_files[]   = $stored_file;
				$attachment_ids[] = $result['attachmentId'];
			}

			$answers[ $field_key ]['files'] = $stored_files;
		}

		return array(
			'answers'       => $answers,
			'attachmentIds' => $attachment_ids,
		);
	}

	/**
	 * Delete attachments created during a submission that ultimately failed to
	 * persist (D6). Best-effort: failures here are not surfaced to the client
	 * since the persistence_failed response has already been decided.
	 *
	 * @param int[] $attachment_ids  Attachment IDs created by store_photos().
	 */
	private function cleanup_orphaned_photos( array $attachment_ids ): void {
		foreach ( $attachment_ids as $attachment_id ) {
			$this->photo_storage->delete_photo( $attachment_id );
		}
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
