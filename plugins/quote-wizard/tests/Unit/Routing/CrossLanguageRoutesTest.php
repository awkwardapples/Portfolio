<?php
/**
 * Cross-language route table consistency test.
 *
 * Parses apps/wizard/src/site/routing/routes.ts and asserts that the path
 * list matches SiteRoutes::PATHS exactly. This guards against one side being
 * updated without the other.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\SiteRoutes;

it( 'TypeScript routes.ts and PHP SiteRoutes::PATHS are in sync', function (): void {
	$ts_file = dirname( __DIR__, 3 ) . '/../../apps/wizard/src/site/routing/routes.ts';
	expect( file_exists( $ts_file ) )->toBeTrue( "routes.ts not found at: {$ts_file}" );

	$contents = (string) file_get_contents( $ts_file );

	// Match lines like: path: '/some-path',
	// Anchored on the routes.ts shape from Step 5.0. If routes.ts is restructured,
	// update this regex — that is the intentional cost of the duplication-with-test approach.
	preg_match_all( "/path:\s*'([^']+)'/", $contents, $matches );
	$ts_paths = $matches[1];

	expect( $ts_paths )->toBe(
		SiteRoutes::PATHS,
		'TypeScript routes.ts and PHP SiteRoutes::PATHS are out of sync. ' .
		'Update both sides together when adding or removing routes.'
	);
} );
