<?php
/**
 * Unit tests for CanonicalRedirectGuard.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\CanonicalRedirectGuard;
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

it( 'suppresses canonical redirect for a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	$_SERVER['REQUEST_URI'] = '/quote';

	$result = CanonicalRedirectGuard::maybe_suppress_redirect(
		'http://example.com/',
		'http://example.com/quote'
	);

	expect( $result )->toBeFalse();
} );

it( 'preserves canonical redirect URL for a non-React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	$_SERVER['REQUEST_URI'] = '/some-other-page';
	$original_redirect      = 'http://example.com/canonical-destination';

	$result = CanonicalRedirectGuard::maybe_suppress_redirect(
		$original_redirect,
		'http://example.com/some-other-page'
	);

	expect( $result )->toBe( $original_redirect );
} );

it( 'preserves canonical redirect URL in admin context even for a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( true );
	$_SERVER['REQUEST_URI'] = '/quote';
	$original_redirect      = 'http://example.com/goqw-site-root';

	$result = CanonicalRedirectGuard::maybe_suppress_redirect(
		$original_redirect,
		'http://example.com/quote'
	);

	expect( $result )->toBe( $original_redirect );
} );
