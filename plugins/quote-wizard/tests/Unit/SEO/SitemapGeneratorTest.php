<?php
/**
 * Unit tests for SitemapGenerator.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\SitemapGenerator;
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

it( 'generates XML containing all 6 React routes', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->alias(
		static function ( string $path ): string {
			return 'http://example.test' . $path;
		}
	);
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'esc_html' )->returnArg();

	$xml = SitemapGenerator::generate_sitemap_xml();

	expect( $xml )->toContain( 'http://example.test/' );
	expect( $xml )->toContain( 'http://example.test/quote' );
	expect( $xml )->toContain( 'http://example.test/services' );
	expect( $xml )->toContain( 'http://example.test/our-work' );
	expect( $xml )->toContain( 'http://example.test/contact' );
	expect( $xml )->toContain( 'http://example.test/privacy' );
} );

it( 'generates valid XML sitemap structure', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'esc_html' )->returnArg();

	$xml = SitemapGenerator::generate_sitemap_xml();

	expect( $xml )->toStartWith( '<?xml version="1.0" encoding="UTF-8"?>' );
	expect( $xml )->toContain( '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' );
	expect( $xml )->toContain( '</urlset>' );
	expect( $xml )->toContain( '<url>' );
	expect( $xml )->toContain( '</url>' );
} );

it( 'home route has priority 1.0', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->alias(
		static function ( string $path ): string {
			return 'http://example.test' . $path;
		}
	);
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'esc_html' )->returnArg();

	$xml = SitemapGenerator::generate_sitemap_xml();

	// The home route URL block should contain priority 1.0.
	$home_block_pos = strpos( $xml, 'http://example.test/' );
	$priority_pos   = strpos( $xml, '1.0', (int) $home_block_pos );
	expect( $priority_pos )->not->toBeFalse();
} );

it( 'each URL entry includes changefreq and priority elements', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'esc_html' )->returnArg();

	$xml = SitemapGenerator::generate_sitemap_xml();

	expect( substr_count( $xml, '<changefreq>' ) )->toBe( 6 );
	expect( substr_count( $xml, '<priority>' ) )->toBe( 6 );
	expect( substr_count( $xml, '<lastmod>' ) )->toBe( 6 );
} );

it( 'uses goqw_sitemap_lastmod override when set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			return 'goqw_sitemap_lastmod' === $key ? '2026-01-15' : '';
		}
	);
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'esc_url' )->returnArg();
	Functions\when( 'esc_html' )->returnArg();

	$xml = SitemapGenerator::generate_sitemap_xml();

	expect( $xml )->toContain( '2026-01-15' );
} );

it( 'add_query_var appends goqw_sitemap to the vars array', function (): void {
	$result = SitemapGenerator::add_query_var( array( 'existing_var' ) );

	expect( $result )->toContain( 'goqw_sitemap' );
	expect( $result )->toContain( 'existing_var' );
} );

// ---------------------------------------------------------------------------
// Activation-time rewrite registration (5.12b)
// ---------------------------------------------------------------------------

it( 'add_rewrite_rule registers the sitemap rewrite at top priority', function (): void {
	Functions\expect( 'add_rewrite_rule' )
		->once()
		->with( '^sitemap\.xml$', 'index.php?goqw_sitemap=1', 'top' );

	SitemapGenerator::add_rewrite_rule();
} );
