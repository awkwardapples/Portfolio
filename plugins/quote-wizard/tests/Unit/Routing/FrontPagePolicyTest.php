<?php
/**
 * Unit tests for FrontPagePolicy.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\FrontPagePolicy;
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
 * Build a SiteRootPage stub whose ensure() returns the given ID.
 *
 * @param int $id Page ID to return from ensure().
 */
function stub_page( int $id ): SiteRootPage {
	$stub = \Mockery::mock( SiteRootPage::class );
	$stub->shouldReceive( 'ensure' )->andReturn( $id );
	return $stub;
}

// ---------------------------------------------------------------------------
// apply_on_activation()
// ---------------------------------------------------------------------------

it( 'sets show_on_front and page_on_front when show_on_front is "posts"', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $default = '' ): mixed {
			return match ( $key ) {
				'show_on_front' => 'posts',
				'page_on_front' => 0,
				default         => $default,
			};
		}
	);
	Functions\expect( 'update_option' )
		->once()->with( 'show_on_front', 'page' )
		->andReturn( true );
	Functions\expect( 'update_option' )
		->once()->with( 'page_on_front', 42 )
		->andReturn( true );

	$policy = new FrontPagePolicy( stub_page( 42 ) );
	$result = $policy->apply_on_activation();

	expect( $result )->toBeTrue();
} );

it( 'sets show_on_front and page_on_front when show_on_front is "page" with no page_on_front', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $default = '' ): mixed {
			return match ( $key ) {
				'show_on_front' => 'page',
				'page_on_front' => 0,
				default         => $default,
			};
		}
	);
	Functions\expect( 'update_option' )
		->once()->with( 'show_on_front', 'page' )
		->andReturn( true );
	Functions\expect( 'update_option' )
		->once()->with( 'page_on_front', 10 )
		->andReturn( true );

	$policy = new FrontPagePolicy( stub_page( 10 ) );
	$result = $policy->apply_on_activation();

	expect( $result )->toBeTrue();
} );

it( 'leaves settings unchanged and queues transient when front page is already configured', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $default = '' ): mixed {
			return match ( $key ) {
				'show_on_front' => 'page',
				'page_on_front' => 99,
				default         => $default,
			};
		}
	);
	Functions\expect( 'update_option' )->never();
	Functions\expect( 'set_transient' )
		->once()
		->with( FrontPagePolicy::NOTICE_TRANSIENT, \Mockery::type( 'array' ), \Mockery::any() )
		->andReturn( true );

	$policy = new FrontPagePolicy( stub_page( 5 ) );
	$result = $policy->apply_on_activation();

	expect( $result )->toBeFalse();
} );

it( 'returns false (leave-alone case) when a custom front page is set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $default = '' ): mixed {
			return match ( $key ) {
				'show_on_front' => 'page',
				'page_on_front' => 7,
				default         => $default,
			};
		}
	);
	// update_option must NOT be called in the leave-alone case.
	Functions\expect( 'set_transient' )
		->once()
		->with( FrontPagePolicy::NOTICE_TRANSIENT, \Mockery::type( 'array' ), \Mockery::any() )
		->andReturn( true );

	$policy = new FrontPagePolicy( stub_page( 3 ) );

	expect( $policy->apply_on_activation() )->toBeFalse();
} );

// ---------------------------------------------------------------------------
// maybe_render_notice()
// ---------------------------------------------------------------------------

it( 'does nothing when the transient is absent', function (): void {
	Functions\when( 'get_transient' )->justReturn( false );
	Functions\expect( 'current_user_can' )->never();
	Functions\expect( 'delete_transient' )->never();

	$policy = new FrontPagePolicy( stub_page( 1 ) );
	ob_start();
	$policy->maybe_render_notice();
	$output = ob_get_clean();

	expect( $output )->toBe( '' );
} );

it( 'outputs the notice when transient is set and user has manage_options', function (): void {
	Functions\when( 'get_transient' )->justReturn( array( 'site_root_id' => 5, 'existing_id' => 3 ) );
	Functions\when( 'current_user_can' )->justReturn( true );
	Functions\when( 'get_edit_post_link' )->justReturn( 'http://example.test/wp-admin/post.php?post=5' );
	Functions\when( 'admin_url' )->justReturn( 'http://example.test/wp-admin/options-reading.php' );
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'delete_transient' )->justReturn( true );

	$policy = new FrontPagePolicy( stub_page( 1 ) );
	ob_start();
	$policy->maybe_render_notice();
	$output = ob_get_clean();

	expect( $output )->toContain( 'Quote Wizard:' );
	expect( $output )->toContain( 'notice-warning' );
} );

it( 'does not output the notice when user lacks manage_options', function (): void {
	Functions\when( 'get_transient' )->justReturn( array( 'site_root_id' => 5, 'existing_id' => 3 ) );
	Functions\when( 'current_user_can' )->justReturn( false );

	$policy = new FrontPagePolicy( stub_page( 1 ) );
	ob_start();
	$policy->maybe_render_notice();
	$output = ob_get_clean();

	expect( $output )->toBe( '' );
} );

it( 'deletes the transient after rendering (one-shot)', function (): void {
	Functions\when( 'get_transient' )->justReturn( array( 'site_root_id' => 5, 'existing_id' => 3 ) );
	Functions\when( 'current_user_can' )->justReturn( true );
	Functions\when( 'get_edit_post_link' )->justReturn( '' );
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'admin_url' )->justReturn( '' );
	Functions\expect( 'delete_transient' )->once()->with( FrontPagePolicy::NOTICE_TRANSIENT );

	$policy = new FrontPagePolicy( stub_page( 1 ) );
	ob_start();
	$policy->maybe_render_notice();
	ob_end_clean();
} );

// ---------------------------------------------------------------------------
// Namespace prefix defense (Step 5.14.1)
// ---------------------------------------------------------------------------

it( 'every WordPress function call in FrontPagePolicy.php is backslash-prefixed', function (): void {
	$source = (string) file_get_contents( __DIR__ . '/../../../src/Routing/FrontPagePolicy.php' );

	assert_wp_calls_are_prefixed(
		$source,
		[
			'get_option',
			'update_option',
			'set_transient',
			'get_transient',
			'delete_transient',
			'current_user_can',
			'esc_url',
			'admin_url',
			'get_edit_post_link',
		]
	);
} );
