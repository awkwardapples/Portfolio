<?php
/**
 * Unit tests for DuplicateDetector.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Submissions\DuplicateDetector;
use Agency\QuoteWizard\Submissions\SubmissionRepository;

/**
 * Stub repository that records find_recent_by_contact() calls and returns a
 * fixed result, so tests exercise DuplicateDetector's normalization and
 * window logic without touching real $wpdb (matches spy_repository() in
 * SubmissionControllerTest.php).
 *
 * @param int|null $returns  find_recent_by_contact() return value.
 */
function spy_submission_repository_for_duplicates( ?int $returns ): object {
	return new class ( $returns ) extends SubmissionRepository {
		/** @var list<array{email: string, phone: string, windowStart: string}> */
		public array $calls = [];

		public function __construct( private readonly ?int $returns ) {
			// Parent constructor not called: find_recent_by_contact() is overridden
			// below and never touches $this->wpdb.
		}

		public function find_recent_by_contact( string $normalized_email, string $normalized_phone, string $window_start ): ?int {
			$this->calls[] = array(
				'email'       => $normalized_email,
				'phone'       => $normalized_phone,
				'windowStart' => $window_start,
			);
			return $this->returns;
		}
	};
}

it( 'reports a duplicate when the repository finds a matching email', function (): void {
	$repo     = spy_submission_repository_for_duplicates( 42 );
	$detector = new DuplicateDetector( $repo );

	$result = $detector->check( 'jane@example.com', '' );

	expect( $result )->toBe( array( 'isDuplicate' => true, 'originalSubmissionId' => 42 ) );
} );

it( 'reports a duplicate when the repository finds a matching phone', function (): void {
	$repo     = spy_submission_repository_for_duplicates( 7 );
	$detector = new DuplicateDetector( $repo );

	$result = $detector->check( '', '07123456789' );

	expect( $result )->toBe( array( 'isDuplicate' => true, 'originalSubmissionId' => 7 ) );
} );

it( 'reports no duplicate when the repository finds nothing', function (): void {
	$repo     = spy_submission_repository_for_duplicates( null );
	$detector = new DuplicateDetector( $repo );

	$result = $detector->check( 'jane@example.com', '07123456789' );

	expect( $result )->toBe( array( 'isDuplicate' => false ) );
} );

it( 'normalizes email to lowercase and trims whitespace before querying', function (): void {
	$repo     = spy_submission_repository_for_duplicates( null );
	$detector = new DuplicateDetector( $repo );

	$detector->check( '  Jane@EXAMPLE.com  ', '' );

	expect( $repo->calls[0]['email'] )->toBe( 'jane@example.com' );
} );

it( 'normalizes phone to digits-only before querying', function (): void {
	$repo     = spy_submission_repository_for_duplicates( null );
	$detector = new DuplicateDetector( $repo );

	$detector->check( '', '+44 (0)7123-456 789' );

	expect( $repo->calls[0]['phone'] )->toBe( '4407123456789' );
} );

it( 'computes a window start 24 hours before now (UTC)', function (): void {
	$repo     = spy_submission_repository_for_duplicates( null );
	$detector = new DuplicateDetector( $repo );

	$before = gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS );
	$detector->check( 'jane@example.com', '' );
	$after = gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS );

	expect( $repo->calls[0]['windowStart'] )->toBeGreaterThanOrEqual( $before );
	expect( $repo->calls[0]['windowStart'] )->toBeLessThanOrEqual( $after );
} );

it( 'skips the query entirely when both email and phone are empty', function (): void {
	$repo     = spy_submission_repository_for_duplicates( 99 );
	$detector = new DuplicateDetector( $repo );

	$result = $detector->check( '', '' );

	expect( $result )->toBe( array( 'isDuplicate' => false ) );
	expect( $repo->calls )->toBe( [] );
} );
