<?php
/**
 * Unit tests for SelfHealer.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\SelfHealer;
use Agency\QuoteWizard\Routing\SiteRootPage;
use Brain\Monkey;
use Brain\Monkey\Functions;

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a SiteRootPage mock.
 *
 * @param int  $stored_id  What id() returns.
 * @param bool $expect_ensure  Whether ensure() should be called.
 */
function make_page_mock( int $stored_id, bool $expect_ensure = false ): SiteRootPage {
	$mock = \Mockery::mock( SiteRootPage::class );
	$mock->shouldReceive( 'id' )->andReturn( $stored_id );
	if ( $expect_ensure ) {
		$mock->shouldReceive( 'ensure' )->once()->andReturn( $stored_id > 0 ? $stored_id : 99 );
	} else {
		$mock->shouldNotReceive( 'ensure' );
	}
	return $mock;
}

// ---------------------------------------------------------------------------
// Scope gates
// ---------------------------------------------------------------------------

it( 'does nothing in admin context', function (): void {
	Functions\when( 'is_admin' )->justReturn( true );

	// ensure() must not be called; the mock will fail the test if it is.
	$healer = new SelfHealer( make_page_mock( 0 ) );
	$healer->check();

	expect( true )->toBeTrue(); // reached without exception = pass
} );

// ---------------------------------------------------------------------------
// Self-heal paths
// ---------------------------------------------------------------------------

it( 'calls ensure() when stored ID is 0', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );

	$healer = new SelfHealer( make_page_mock( 0, true ) );
	$healer->check();
} );

it( 'calls ensure() when stored page is missing', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_post' )->justReturn( null );

	$healer = new SelfHealer( make_page_mock( 5, true ) );
	$healer->check();
} );

it( 'calls ensure() when stored page has non-publish status', function (): void {
	$post              = new \WP_Post();
	$post->post_status = 'trash';

	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_post' )->justReturn( $post );

	$healer = new SelfHealer( make_page_mock( 5, true ) );
	$healer->check();
} );

it( 'does NOT call ensure() when a valid published page exists', function (): void {
	$post              = new \WP_Post();
	$post->post_status = 'publish';

	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_post' )->justReturn( $post );

	$healer = new SelfHealer( make_page_mock( 5, false ) );
	$healer->check();
} );
