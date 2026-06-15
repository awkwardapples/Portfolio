<?php
/**
 * Suppresses WordPress canonical redirect for React-hosted routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * WordPress's redirect_canonical function redirects requests to the
 * "canonical" URL of the loaded WP_Post. For every React route (/, /services,
 * /our-work, /contact, /quote), the loaded post is Site Root
 * (post_name=goqw-site-root), so WordPress concludes the canonical URL is
 * something other than the path the user requested and issues a 301.
 *
 * This guard hooks the redirect_canonical filter and returns false for React
 * routes, suppressing the redirect. All other URLs receive the original
 * redirect URL unchanged, preserving standard WordPress canonical behaviour.
 *
 * Scope guards (admin, REST, CLI, unrecognised paths) live inside
 * SiteRoutes::is_current_request_react_route().
 *
 * See ADR-0020 amendment (5.7-remediation).
 */
final class CanonicalRedirectGuard {

	/**
	 * Register the canonical-redirect filter. Idempotent.
	 */
	public static function register(): void {
		add_filter(
			'redirect_canonical',
			array( __CLASS__, 'maybe_suppress_redirect' ),
			10,
			2
		);
	}

	/**
	 * Filter callback for redirect_canonical.
	 *
	 * @param string|false $redirect_url  URL WordPress would redirect to, or false.
	 * @param string       $requested_url The URL the user actually requested.
	 * @return string|false
	 */
	public static function maybe_suppress_redirect( $redirect_url, $requested_url ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed
		if ( SiteRoutes::is_current_request_react_route() ) {
			return false;
		}
		return $redirect_url;
	}
}
