<?php
/**
 * Unit tests for RobotsTxtCustomizer.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\RobotsTxtCustomizer;
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

it( 'adds Sitemap directive to robots.txt output', function (): void {
	Functions\when( 'home_url' )->alias(
		static function ( string $path ): string {
			return 'http://example.test' . $path;
		}
	);

	$result = RobotsTxtCustomizer::customize( "User-agent: *\nDisallow: /wp-admin/\n", '1' );

	expect( $result )->toContain( 'Sitemap:' );
	expect( $result )->toContain( 'http://example.test/sitemap.xml' );
} );

it( 'Sitemap URL uses home_url with /sitemap.xml path', function (): void {
	Functions\when( 'home_url' )->alias(
		static function ( string $path ): string {
			return 'https://client-site.co.uk' . $path;
		}
	);

	$result = RobotsTxtCustomizer::customize( '', '1' );

	expect( $result )->toContain( 'https://client-site.co.uk/sitemap.xml' );
} );

it( 'returns unchanged output when site is set to private', function (): void {
	$original = "User-agent: *\nDisallow: /\n";

	$result = RobotsTxtCustomizer::customize( $original, '0' );

	expect( $result )->toBe( $original );
} );

it( 'appends to existing robots content without overwriting it', function (): void {
	Functions\when( 'home_url' )->returnArg();

	$existing = "User-agent: *\nDisallow: /wp-admin/\n";

	$result = RobotsTxtCustomizer::customize( $existing, '1' );

	expect( $result )->toContain( "User-agent: *\nDisallow: /wp-admin/" );
	expect( $result )->toContain( 'Sitemap:' );
} );
