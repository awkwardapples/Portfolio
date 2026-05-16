<?php
/**
 * Submission pruning cron job.
 *
 * STUB FOR STEP 3D — real pruning logic lands in Step 6.5.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Cron;

defined( 'ABSPATH' ) || exit;

/**
 * Daily WP-Cron job that deletes submission records older than the retention
 * period (default 90 days; configurable via Settings::retention_days()).
 *
 * The cron event 'goqw_prune_submissions' is scheduled in Activator. This class
 * holds the callback that runs on each tick.
 *
 * Real implementation + tests in Step 6.5.
 */
final class PruneSubmissions {

	/**
	 * Run a pruning pass. Hooked to 'goqw_prune_submissions' (scheduled daily).
	 */
	public static function run(): void {
		// Real implementation in Step 6.5.
	}
}
