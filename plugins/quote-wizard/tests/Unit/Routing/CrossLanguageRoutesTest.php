<?php
/**
 * Cross-language route table consistency test.
 *
 * Parses apps/wizard/src/site/routing/routes.ts and asserts that the path
 * list matches SiteRoutes::PATHS exactly. This guards against one side being
 * updated without the other.
 *
 * Since Step 6.8, the 5 SEO service landing page routes are generated in
 * routes.ts from service-pages-content.ts's servicePages array rather than
 * declared as literal `path: '...'` entries in routes.ts itself — so this
 * test also parses service-pages-content.ts and appends those paths in
 * file order, matching how routes.ts appends them after the 6 static routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Routing\SiteRoutes;

it( 'TypeScript routes.ts and PHP SiteRoutes::PATHS are in sync', function (): void {
	$ts_file      = dirname( __DIR__, 3 ) . '/../../apps/wizard/src/site/routing/routes.ts';
	$content_file = dirname( __DIR__, 3 ) . '/../../apps/wizard/src/site/content/service-pages-content.ts';
	expect( file_exists( $ts_file ) )->toBeTrue( "routes.ts not found at: {$ts_file}" );
	expect( file_exists( $content_file ) )->toBeTrue( "service-pages-content.ts not found at: {$content_file}" );

	// Match lines like: path: '/some-path',
	// Anchored on the routes.ts shape from Step 5.0. If routes.ts is restructured,
	// update this regex — that is the intentional cost of the duplication-with-test approach.
	preg_match_all( "/path:\s*'([^']+)'/", (string) file_get_contents( $ts_file ), $static_matches );
	$static_paths = $static_matches[1];

	preg_match_all( "/path:\s*'([^']+)'/", (string) file_get_contents( $content_file ), $service_page_matches );
	$service_page_paths = $service_page_matches[1];

	$ts_paths = array_merge( $static_paths, $service_page_paths );

	expect( $ts_paths )->toBe(
		SiteRoutes::PATHS,
		'TypeScript routes.ts (+ service-pages-content.ts) and PHP SiteRoutes::PATHS are out of sync. ' .
		'Update both sides together when adding or removing routes.'
	);
} );
