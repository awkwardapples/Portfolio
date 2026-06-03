<?php
/**
 * Main query interceptor for recognized site routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Intercepts WordPress's main query for recognized site routes and rewrites
 * it to load the Site Root page.
 *
 * Scope discipline: this filter ONLY acts when all of the following are true:
 *   - it's the main query (is_main_query())
 *   - we're not in the admin (!is_admin())
 *   - we're not in the REST context (!REST_REQUEST)
 *   - we're not in a cron/wp-cli context
 *   - the request URI exactly matches one of SiteRoutes::PATHS
 *
 * All other requests (wp-admin, REST API, wp-cron, secondary queries, any
 * unrecognized URL) pass through unmodified.
 */
final class RouteInterceptor {

	/**
	 * Constructor.
	 *
	 * @param SiteRootPage $page The Site Root page manager.
	 */
	public function __construct( private readonly SiteRootPage $page ) {}

	/**
	 * Filter callback for 'pre_get_posts'.
	 *
	 * @param \WP_Query $query The current query.
	 */
	public function maybe_intercept( \WP_Query $query ): void {
		if ( is_admin() ) {
			return;
		}
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			return;
		}
		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			return;
		}
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			return;
		}
		if ( ! $query->is_main_query() ) {
			return;
		}

		$request_path = SiteRoutes::current_request_path();
		if ( ! SiteRoutes::is_recognized( $request_path ) ) {
			return;
		}

		$site_root_id = $this->page->id();
		if ( $site_root_id <= 0 ) {
			return;
		}

		$query->set( 'page_id', $site_root_id );
		$query->set( 'post_type', 'page' );
		$query->is_home     = false; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$query->is_page     = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$query->is_singular = true; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
