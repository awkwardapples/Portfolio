<?php
/**
 * Duplicate submission detection (Step 5.13g, ADR-0028).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Flags a submission as a duplicate when a non-duplicate submission with a
 * matching (normalized) contact_email or contact_phone was persisted within
 * the last 24 hours (D1, D2).
 *
 * Normalization happens here, not in SubmissionRepository, because it's
 * business logic (what counts as "the same contact"), not data access — the
 * repository's SQL only knows how to compare already-normalized strings
 * (AUDIT-5.13g-existing-data.md: contact_email/contact_phone are collected
 * with client-side format validation but are not server-normalized before
 * this step).
 */
final class DuplicateDetector {

	/**
	 * Duplicate-detection window (D2). Uses DAY_IN_SECONDS rather than a
	 * literal 86400 to match the constant already used throughout this
	 * plugin (e.g. PhotoRetention, RateLimiter).
	 */
	private const WINDOW_SECONDS = DAY_IN_SECONDS;

	/**
	 * Constructor.
	 *
	 * @param SubmissionRepository $repository  Data-access layer for goqw_submissions.
	 */
	public function __construct( private readonly SubmissionRepository $repository ) {}

	/**
	 * Check whether a submission with this contact info was already
	 * persisted (and not itself a duplicate) within the last 24 hours.
	 *
	 * @param  string $email  Raw contact_email answer ('' when absent).
	 * @param  string $phone  Raw contact_phone answer ('' when absent).
	 * @return array{isDuplicate: bool, originalSubmissionId?: int}
	 */
	public function check( string $email, string $phone ): array {
		$normalized_email = strtolower( trim( $email ) );
		$normalized_phone = (string) preg_replace( '/\D+/', '', $phone );

		if ( '' === $normalized_email && '' === $normalized_phone ) {
			return array( 'isDuplicate' => false );
		}

		// Window is computed in UTC (gmdate), matching created_at's storage
		// convention (current_time('mysql', true)) — using local server time
		// here would silently shift the window by the server's UTC offset.
		$window_start = gmdate( 'Y-m-d H:i:s', time() - self::WINDOW_SECONDS );

		$match_id = $this->repository->find_recent_by_contact( $normalized_email, $normalized_phone, $window_start );

		if ( null === $match_id ) {
			return array( 'isDuplicate' => false );
		}

		return array(
			'isDuplicate'          => true,
			'originalSubmissionId' => $match_id,
		);
	}
}
