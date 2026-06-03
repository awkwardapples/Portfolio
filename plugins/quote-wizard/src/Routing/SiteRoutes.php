<?php
/**
 * Recognized site routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Recognized site routes. MUST match src/site/routing/routes.ts exactly.
 * The cross-language consistency test (CrossLanguageRoutesTest) enforces this;
 * do not edit one side without the other.
 *
 * Each entry is a normalized path beginning with '/'.
 */
final class SiteRoutes {

	/**
	 * The ordered list of paths handled by the React app. Order matches the
	 * nav order defined in routes.ts.
	 */
	public const PATHS = array( '/', '/services', '/our-work', '/contact', '/quote' );

	/**
	 * Normalize a request path the same way matchRoute() does in routes.ts:
	 * strip trailing slash except on root.
	 *
	 * @param string $request_path The request URI path component.
	 */
	public static function normalize( string $request_path ): string {
		if ( $request_path === '/' || $request_path === '' ) {
			return '/';
		}
		return rtrim( $request_path, '/' );
	}

	/**
	 * Is this path one of the recognized React routes?
	 *
	 * @param string $request_path The request URI path component.
	 */
	public static function is_recognized( string $request_path ): bool {
		return in_array( self::normalize( $request_path ), self::PATHS, true );
	}
}
