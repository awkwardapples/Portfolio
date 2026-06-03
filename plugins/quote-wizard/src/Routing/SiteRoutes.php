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

	/**
	 * Extract the path portion of the current request URI without query string.
	 *
	 * Shared between RouteInterceptor and SiteRenderer to avoid duplication.
	 * Reads $_SERVER['REQUEST_URI'] — safe at this call site because neither
	 * caller proceeds further without SiteRoutes::is_recognized() returning true.
	 */
	public static function current_request_path(): string {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.WP.AlternativeFunctions.parse_url_parse_url
		$uri = (string) ( $_SERVER['REQUEST_URI'] ?? '/' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		$path = parse_url( $uri, PHP_URL_PATH );
		return is_string( $path ) ? $path : '/';
	}
}
