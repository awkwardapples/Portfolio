<?php
/**
 * Unit tests for RewriteRegistrar.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\RewriteRegistrar;
use Agency\QuoteWizard\Routing\SiteRoutes;
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

it( 'calls add_rewrite_rule once for each non-root path', function (): void {
	$non_root_paths = array_filter( SiteRoutes::PATHS, static fn( string $p ): bool => $p !== '/' );
	$call_count     = count( $non_root_paths );

	Functions\expect( 'add_rewrite_rule' )->times( $call_count );

	$registrar = new RewriteRegistrar();
	$registrar->register();
} );

it( 'does not register a rewrite rule for the root path', function (): void {
	$called_regexes = [];

	Functions\when( 'add_rewrite_rule' )->alias(
		static function ( string $regex ) use ( &$called_regexes ): void {
			$called_regexes[] = $regex;
		}
	);

	$registrar = new RewriteRegistrar();
	$registrar->register();

	foreach ( $called_regexes as $regex ) {
		expect( $regex )->not->toBe( '^/?$' );
		expect( $regex )->not->toStartWith( '^/' );
	}
} );

it( 'add_query_vars appends goqw_route to the input array', function (): void {
	$registrar = new RewriteRegistrar();
	$result    = $registrar->add_query_vars( array( 'page', 'p' ) );

	expect( $result )->toContain( RewriteRegistrar::QUERY_VAR );
	expect( $result )->toContain( 'page' );
	expect( $result )->toContain( 'p' );
} );
