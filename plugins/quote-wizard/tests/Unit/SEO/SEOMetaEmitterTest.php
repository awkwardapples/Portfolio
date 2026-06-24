<?php
/**
 * Unit tests for SEOMetaEmitter.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\SEOMetaEmitter;
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
		unset( $_SERVER['REQUEST_URI'] );
	}
);

// ---------------------------------------------------------------------------
// emit() — React route output
// ---------------------------------------------------------------------------

it( 'emits meta description tag for a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );
	Functions\when( 'esc_attr' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();

	$_SERVER['REQUEST_URI'] = '/quote';

	ob_start();
	SEOMetaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( '<meta name="description"' );
	expect( $output )->toContain( 'quote' );
} );

it( 'emits canonical link tag for a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );
	Functions\when( 'esc_attr' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();

	$_SERVER['REQUEST_URI'] = '/services';

	ob_start();
	SEOMetaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( '<link rel="canonical"' );
	expect( $output )->toContain( '/services' );
} );

it( 'emits all six Open Graph tags', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );
	Functions\when( 'esc_attr' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	SEOMetaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'og:type' );
	expect( $output )->toContain( 'og:title' );
	expect( $output )->toContain( 'og:description' );
	expect( $output )->toContain( 'og:url' );
	expect( $output )->toContain( 'og:image' );
	expect( $output )->toContain( 'og:site_name' );
} );

it( 'emits all four Twitter card tags', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );
	Functions\when( 'esc_attr' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	SEOMetaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'twitter:card' );
	expect( $output )->toContain( 'twitter:title' );
	expect( $output )->toContain( 'twitter:description' );
	expect( $output )->toContain( 'twitter:image' );
} );

// ---------------------------------------------------------------------------
// emit() — non-React route scope guard
// ---------------------------------------------------------------------------

it( 'emits nothing for an unrecognized (non-React) route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );

	$_SERVER['REQUEST_URI'] = '/some-other-page';

	ob_start();
	SEOMetaEmitter::emit();
	$output = ob_get_clean();

	expect( trim( $output ) )->toBe( '' );
} );

// ---------------------------------------------------------------------------
// maybe_override_title()
// ---------------------------------------------------------------------------

it( 'maybe_override_title returns route-specific title on a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );

	$_SERVER['REQUEST_URI'] = '/';

	$result = SEOMetaEmitter::maybe_override_title( 'WordPress Default' );

	expect( $result )->toContain( 'Acme Fencing' );
} );

it( 'maybe_override_title returns the original title for a non-React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );

	$_SERVER['REQUEST_URI'] = '/some-other-page';

	$result = SEOMetaEmitter::maybe_override_title( 'Edit Post — WordPress' );

	expect( $result )->toBe( 'Edit Post — WordPress' );
} );
