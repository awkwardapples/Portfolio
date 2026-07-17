<?php
/**
 * Submission pruning cron job (Step 5.14, ADR-0029).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Cron;

use Agency\QuoteWizard\Submissions\SubmissionRepository;
use Agency\QuoteWizard\Support\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Daily WP-Cron job that deletes submission records older than the retention
 * period (Settings::retention_days(), default 90 days).
 *
 * The cron event 'goqw_prune_submissions' has been scheduled in Activator
 * since Step 3D but, per AUDIT-5.13e-cron-pattern.md, was never hooked to a
 * callback — this step is what wires it up (Plugin::boot()), following the
 * same schedule/hook/implement shape PhotoRetention already established for
 * 'goqw_photo_retention_cleanup'.
 *
 * Photo attachments are NOT deleted here — PhotoRetention already owns that
 * lifecycle independently, on its own 6-month cadence driven by attachment
 * post meta/date, not by whether a submission row still exists. Coupling the
 * two would introduce a second, redundant path to delete the same
 * attachment and is out of scope for this step (AUDIT-5.14-consent-
 * storage.md's data-retention notes).
 */
final class PruneSubmissions {

	/**
	 * Constructor.
	 *
	 * @param SubmissionRepository|null $repository  Defaults to a repository built from the global $wpdb.
	 */
	public function __construct( private readonly ?SubmissionRepository $repository = null ) {}

	/**
	 * Entry point hooked to 'goqw_prune_submissions' (scheduled daily).
	 */
	public static function run(): void {
		( new self() )->execute();
	}

	/**
	 * Delete every submission row older than Settings::retention_days().
	 */
	public function execute(): void {
		$cutoff = \gmdate( 'Y-m-d H:i:s', time() - Settings::retention_days() * DAY_IN_SECONDS );
		$this->repository()->delete_older_than( $cutoff );
	}

	/**
	 * Resolve the repository, building the default from the global $wpdb
	 * lazily (not in the constructor default) — `new SubmissionRepository( $wpdb )`
	 * is not a constant expression PHP allows as a promoted parameter default,
	 * the same constraint documented on DuplicateDetector's construction in
	 * SubmissionController.
	 */
	private function repository(): SubmissionRepository {
		if ( null !== $this->repository ) {
			return $this->repository;
		}
		global $wpdb;
		return new SubmissionRepository( $wpdb );
	}
}
