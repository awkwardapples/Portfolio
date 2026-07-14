<?php
/**
 * Unit tests for PruneSubmissions (Step 5.14, ADR-0029).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Cron\PruneSubmissions;
use Agency\QuoteWizard\Submissions\SubmissionRepository;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Stub repository that records delete_older_than() calls without touching
 * real $wpdb (matches spy_submission_repository_for_duplicates() in
 * DuplicateDetectorTest.php).
 *
 * @param int $returns  delete_older_than() return value.
 */
function spy_submission_repository_for_pruning( int $returns = 0 ): object {
	return new class ( $returns ) extends SubmissionRepository {
		/** @var list<string> */
		public array $calls = [];

		public function __construct( private readonly int $returns ) {
			// Parent constructor not called: delete_older_than() is overridden
			// below and never touches $this->wpdb.
		}

		public function delete_older_than( string $cutoff ): int {
			$this->calls[] = $cutoff;
			return $this->returns;
		}
	};
}

beforeEach(
	function (): void {
		Monkey\setUp();
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

it(
	'deletes rows older than the configured retention period',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => $default
		);

		$repo   = spy_submission_repository_for_pruning( 3 );
		$pruner = new PruneSubmissions( $repo );
		$pruner->execute();

		expect( $repo->calls )->toHaveCount( 1 );
	}
);

it(
	'computes a cutoff approximately Settings::retention_days() (default 90) before now, in UTC',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => $default
		);

		$repo   = spy_submission_repository_for_pruning();
		$pruner = new PruneSubmissions( $repo );

		$before = gmdate( 'Y-m-d H:i:s', time() - 90 * DAY_IN_SECONDS );
		$pruner->execute();
		$after = gmdate( 'Y-m-d H:i:s', time() - 90 * DAY_IN_SECONDS );

		expect( $repo->calls[0] )->toBeGreaterThanOrEqual( $before );
		expect( $repo->calls[0] )->toBeLessThanOrEqual( $after );
	}
);

it(
	'uses a shorter cutoff when goqw_retention_days is configured to a smaller value',
	function (): void {
		Functions\when( 'get_option' )->alias(
			static function ( string $key, mixed $default = '' ): mixed {
				return 'goqw_retention_days' === $key ? 30 : $default;
			}
		);

		$repo   = spy_submission_repository_for_pruning();
		$pruner = new PruneSubmissions( $repo );

		$before = gmdate( 'Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS );
		$pruner->execute();
		$after = gmdate( 'Y-m-d H:i:s', time() - 30 * DAY_IN_SECONDS );

		expect( $repo->calls[0] )->toBeGreaterThanOrEqual( $before );
		expect( $repo->calls[0] )->toBeLessThanOrEqual( $after );
	}
);

