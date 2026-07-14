<?php
/**
 * Unit tests for SEORouteContent.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\SEORouteContent;
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

it( 'returns content array for a known route', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );

	$content = SEORouteContent::get_content( '/' );

	expect( $content )->not->toBeNull();
	expect( $content )->toHaveKeys( array( 'title', 'description', 'og_type' ) );
} );

it( 'returns null for an unknown route', function (): void {
	$content = SEORouteContent::get_content( '/unknown' );

	expect( $content )->toBeNull();
} );

it( 'default home title contains Acme Fencing', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );

	$content = SEORouteContent::get_content( '/' );

	expect( $content['title'] )->toContain( 'Acme Fencing' );
} );

it( 'per-client goqw option overrides default home title', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			return 'goqw_seo_title_home' === $key ? 'Custom Home Title' : '';
		}
	);

	$content = SEORouteContent::get_content( '/' );

	expect( $content['title'] )->toBe( 'Custom Home Title' );
} );

it( 'per-client goqw option overrides default quote description', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			return 'goqw_seo_description_quote' === $key ? 'Custom quote description.' : '';
		}
	);

	$content = SEORouteContent::get_content( '/quote' );

	expect( $content['description'] )->toBe( 'Custom quote description.' );
} );

it( 'empty option value falls back to template default', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );

	$content = SEORouteContent::get_content( '/' );

	expect( $content['title'] )->toContain( 'Acme Fencing' );
} );

it( 'all six routes return non-null content', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );

	foreach ( array( '/', '/services', '/our-work', '/contact', '/quote', '/privacy' ) as $route ) {
		expect( SEORouteContent::get_content( $route ) )->not->toBeNull();
	}
} );

it( 'get_og_image_url returns default plugin asset URL when no override', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );

	$url = SEORouteContent::get_og_image_url();

	expect( $url )->toContain( 'og-image-default.png' );
	expect( $url )->toStartWith( 'http' );
} );
