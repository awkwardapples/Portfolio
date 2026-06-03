<?php
/**
 * Unit tests for SiteRootPage.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

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
// ensure()
// ---------------------------------------------------------------------------

it( 'ensure() creates a page when no option is stored and returns its ID', function (): void {
	Functions\when( 'get_option' )->justReturn( 0 );
	Functions\when( 'wp_insert_post' )->justReturn( 7 );
	Functions\when( 'update_option' )->justReturn( true );

	$page = new SiteRootPage();
	$id   = $page->ensure();

	expect( $id )->toBe( 7 );
} );

it( 'ensure() returns existing ID when option points to a valid published page', function (): void {
	$post              = new \WP_Post();
	$post->ID          = 5;
	$post->post_status = 'publish';
	$post->post_type   = 'page';

	Functions\when( 'get_option' )->justReturn( 5 );
	Functions\when( 'get_post' )->justReturn( $post );

	$page = new SiteRootPage();
	$id   = $page->ensure();

	expect( $id )->toBe( 5 );
} );

it( 'ensure() recreates page when option points to a deleted/missing post', function (): void {
	Functions\when( 'get_option' )->justReturn( 3 );
	Functions\when( 'get_post' )->justReturn( null );
	Functions\when( 'wp_insert_post' )->justReturn( 9 );
	Functions\when( 'update_option' )->justReturn( true );

	$page = new SiteRootPage();
	$id   = $page->ensure();

	expect( $id )->toBe( 9 );
} );

it( 'ensure() recreates page when stored page is not published', function (): void {
	$post              = new \WP_Post();
	$post->post_status = 'draft';
	$post->post_type   = 'page';

	Functions\when( 'get_option' )->justReturn( 4 );
	Functions\when( 'get_post' )->justReturn( $post );
	Functions\when( 'wp_insert_post' )->justReturn( 11 );
	Functions\when( 'update_option' )->justReturn( true );

	$page = new SiteRootPage();
	$id   = $page->ensure();

	expect( $id )->toBe( 11 );
} );

it( 'ensure() throws RuntimeException when wp_insert_post returns WP_Error', function (): void {
	Functions\when( 'get_option' )->justReturn( 0 );
	Functions\when( 'wp_insert_post' )->justReturn( new \WP_Error( 'db_error', 'insert failed' ) );

	$page = new SiteRootPage();

	expect( fn() => $page->ensure() )->toThrow( \RuntimeException::class );
} );

// ---------------------------------------------------------------------------
// id()
// ---------------------------------------------------------------------------

it( 'id() returns the stored option value', function (): void {
	Functions\when( 'get_option' )->justReturn( 42 );

	$page = new SiteRootPage();

	expect( $page->id() )->toBe( 42 );
} );

it( 'id() returns 0 when no option is stored', function (): void {
	Functions\when( 'get_option' )->justReturn( 0 );

	$page = new SiteRootPage();

	expect( $page->id() )->toBe( 0 );
} );

// ---------------------------------------------------------------------------
// delete()
// ---------------------------------------------------------------------------

it( 'delete() calls wp_delete_post and delete_option when a page is stored', function (): void {
	Functions\when( 'get_option' )->justReturn( 5 );
	Functions\expect( 'wp_delete_post' )->once()->with( 5, true );
	Functions\expect( 'delete_option' )->once()->with( SiteRootPage::OPTION_KEY );

	$page = new SiteRootPage();
	$page->delete();
} );

it( 'delete() does not call wp_delete_post when no page is stored', function (): void {
	Functions\when( 'get_option' )->justReturn( 0 );
	Functions\expect( 'wp_delete_post' )->never();
	Functions\expect( 'delete_option' )->once()->with( SiteRootPage::OPTION_KEY );

	$page = new SiteRootPage();
	$page->delete();
} );
