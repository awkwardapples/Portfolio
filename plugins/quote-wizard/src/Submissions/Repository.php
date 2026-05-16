<?php
/**
 * Submission persistence.
 *
 * STUB FOR STEP 3D — real CRUD lands in Step 5.1.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Persists submissions to the goqw_submissions table.
 *
 * All database access for submissions goes through this class. No direct
 * $wpdb queries anywhere else in the codebase. This boundary exists so:
 *
 *   1. SQL injection is impossible by construction (Repository uses $wpdb->prepare).
 *   2. The schema can evolve without touching callers.
 *   3. Tests can mock Repository instead of needing a real DB.
 *
 * Real CRUD methods (insert, update_status, find_by_id, recent) ship in
 * Step 5.1 with the SubmitController.
 */
final class Repository {

	/**
	 * Insert a new submission record.
	 *
	 * @param array<string, mixed> $data Sanitised submission data.
	 * @return never
	 *
	 * @throws \LogicException Always — this is a stub for Step 5.1.
	 */
	public static function insert( array $data ): never {
		unset( $data );

		throw new \LogicException(
			'Repository::insert is not implemented yet — see Step 5.1.'
		);
	}
}
