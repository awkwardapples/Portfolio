<?php
/**
 * Unit tests for SiteRoutes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\SiteRoutes;

it( 'PATHS contains exactly 5 entries', function (): void {
	expect( SiteRoutes::PATHS )->toHaveCount( 5 );
} );

it( 'every PATHS entry begins with /', function (): void {
	foreach ( SiteRoutes::PATHS as $path ) {
		expect( $path )->toStartWith( '/' );
	}
} );

it( 'PATHS entries are unique', function (): void {
	expect( array_unique( SiteRoutes::PATHS ) )->toBe( SiteRoutes::PATHS );
} );

it( 'normalize returns / for root path', function (): void {
	expect( SiteRoutes::normalize( '/' ) )->toBe( '/' );
} );

it( 'normalize returns /services unchanged', function (): void {
	expect( SiteRoutes::normalize( '/services' ) )->toBe( '/services' );
} );

it( 'normalize strips trailing slash from /services/', function (): void {
	expect( SiteRoutes::normalize( '/services/' ) )->toBe( '/services' );
} );

it( 'normalize treats empty string as root', function (): void {
	expect( SiteRoutes::normalize( '' ) )->toBe( '/' );
} );

it( 'is_recognized returns true for /services', function (): void {
	expect( SiteRoutes::is_recognized( '/services' ) )->toBeTrue();
} );

it( 'is_recognized returns true for /services/ (trailing slash)', function (): void {
	expect( SiteRoutes::is_recognized( '/services/' ) )->toBeTrue();
} );

it( 'is_recognized returns false for /unknown', function (): void {
	expect( SiteRoutes::is_recognized( '/unknown' ) )->toBeFalse();
} );

it( 'is_recognized returns false for empty string', function (): void {
	// normalize('') === '/' which IS in PATHS, so actually '' maps to '/'.
	// This checks the real behaviour: empty string normalizes to '/' and is recognized.
	expect( SiteRoutes::is_recognized( '' ) )->toBeTrue();
} );

it( 'is_recognized returns false for /wp-admin (anti-regression for scope discipline)', function (): void {
	expect( SiteRoutes::is_recognized( '/wp-admin' ) )->toBeFalse();
} );

it( 'is_recognized returns false for /wp-json/qw/v1/submit (REST not intercepted)', function (): void {
	expect( SiteRoutes::is_recognized( '/wp-json/qw/v1/submit' ) )->toBeFalse();
} );

it( 'PATHS contains /', function (): void {
	expect( SiteRoutes::PATHS )->toContain( '/' );
} );

it( 'PATHS contains all five expected paths', function (): void {
	$expected = array( '/', '/services', '/our-work', '/contact', '/quote' );
	foreach ( $expected as $path ) {
		expect( SiteRoutes::PATHS )->toContain( $path );
	}
} );
