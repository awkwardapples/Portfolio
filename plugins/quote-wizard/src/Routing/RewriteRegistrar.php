<?php
/**
 * Rewrite rule registration for site routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the WordPress rewrite rules that map recognized paths to the
 * Site Root page query var. Each non-root recognized path gets a rule.
 * The root path '/' is handled by WordPress itself via the front-page setting.
 */
final class RewriteRegistrar {

	/**
	 * Query var name added to the recognized URLs.
	 */
	public const QUERY_VAR = 'goqw_route';

	/**
	 * Register a rewrite rule for each recognized non-root path.
	 */
	public function register(): void {
		foreach ( SiteRoutes::PATHS as $path ) {
			if ( $path === '/' ) {
				continue;
			}

			$regex = '^' . ltrim( $path, '/' ) . '/?$';
			\add_rewrite_rule(
				$regex,
				'index.php?' . self::QUERY_VAR . '=' . rawurlencode( $path ),
				'top'
			);
		}
	}

	/**
	 * Add goqw_route to the list of recognized query vars.
	 *
	 * @param  string[] $vars  Existing query vars.
	 * @return string[]
	 */
	public function add_query_vars( array $vars ): array {
		$vars[] = self::QUERY_VAR;
		return $vars;
	}
}
