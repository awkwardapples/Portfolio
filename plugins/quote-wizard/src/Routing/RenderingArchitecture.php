<?php
/**
 * Rendering architecture: hybrid plugin template for React-hosted routes.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

use Agency\QuoteWizard\Support\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Hooks into WordPress's template_include filter to use a plugin-provided
 * minimal template for React-hosted routes.
 *
 * The five React-hosted routes (defined in SiteRoutes::PATHS) all render
 * via the plugin's minimal template instead of the active theme's templates.
 * This bypasses theme header/footer/title chrome while preserving
 * wp_head() and wp_footer() so plugin compatibility is maintained.
 *
 * Routes not in SiteRoutes::PATHS (wp-admin paths, normal pages, etc.)
 * are unaffected; the theme continues to render them normally.
 *
 * Architectural rationale: ADR-0019.
 */
final class RenderingArchitecture {

	/**
	 * Register the template-filtering hook. Idempotent; safe to call multiple times.
	 */
	public static function register(): void {
		\add_filter( 'template_include', array( __CLASS__, 'filter_template_for_react_routes' ), 100 );
	}

	/**
	 * Filter callback: for React-hosted routes, return the plugin's minimal template path.
	 *
	 * @param string $template The current template path WordPress would use.
	 * @return string The path to use for rendering.
	 */
	public static function filter_template_for_react_routes( string $template ): string {
		if ( ! SiteRoutes::is_current_request_react_route() ) {
			return $template;
		}

		// Match: return plugin's minimal template.
		$minimal_template = self::minimal_template_path();
		if ( ! is_readable( $minimal_template ) ) {
			Logger::warning(
				'React-host template not readable; falling back to theme template',
				array( 'expected_path' => $minimal_template )
			);
			return $template;
		}

		return $minimal_template;
	}

	/**
	 * Absolute filesystem path to the plugin's minimal template.
	 */
	private static function minimal_template_path(): string {
		return GOQW_PLUGIN_DIR . 'templates/react-host.php';
	}
}
