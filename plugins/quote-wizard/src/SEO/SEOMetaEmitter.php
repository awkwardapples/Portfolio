<?php
/**
 * Emits per-route SEO meta tags into wp_head for React-hosted routes.
 *
 * Per ADR-0023 (SEO infrastructure).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\SEO;

use Agency\QuoteWizard\Routing\SiteRoutes;

defined( 'ABSPATH' ) || exit;

/**
 * Emits route-specific meta description, canonical, Open Graph, and Twitter
 * card tags for React-hosted routes via the wp_head action.
 *
 * Also overrides the document title for React routes via pre_get_document_title,
 * integrating with WordPress's _wp_render_title_tag() machinery so the <title>
 * element is emitted from within wp_head() rather than hard-coded in the template.
 *
 * Scope-guarded: silent on wp-admin, REST, CRON, CLI, and unrecognized paths.
 */
final class SEOMetaEmitter {

	/**
	 * Register wp_head and pre_get_document_title hooks.
	 *
	 * Called from Plugin::boot(). Idempotent (add_action de-duplication is
	 * handled by WordPress core — same callback at same priority is a no-op).
	 */
	public static function register(): void {
		// Priority 5: emit before other plugins / themes that also use wp_head.
		\add_action( 'wp_head', array( __CLASS__, 'emit' ), 5 );
		\add_filter( 'pre_get_document_title', array( __CLASS__, 'maybe_override_title' ) );
	}

	/**
	 * Emit SEO meta tags into wp_head.
	 *
	 * Outputs for recognized React routes:
	 *   - <meta name="description">
	 *   - <link rel="canonical">
	 *   - Open Graph: og:type, og:title, og:description, og:url, og:image, og:site_name
	 *   - Twitter card: twitter:card, twitter:title, twitter:description, twitter:image
	 *
	 * The <title> element is NOT emitted here. It is handled by maybe_override_title()
	 * via pre_get_document_title, which feeds WordPress's _wp_render_title_tag().
	 */
	public static function emit(): void {
		if ( ! SiteRoutes::is_current_request_react_route() ) {
			return;
		}

		$route   = SiteRoutes::current_request_path();
		$content = SEORouteContent::get_content( $route );
		if ( null === $content ) {
			return;
		}

		$canonical_url = \home_url( $route );
		$og_image      = SEORouteContent::get_og_image_url();
		$site_name     = \get_bloginfo( 'name' );

		echo "\n\t<meta name=\"description\" content=\"" . \esc_attr( $content['description'] ) . "\">\n";
		echo "\t<link rel=\"canonical\" href=\"" . \esc_url( $canonical_url ) . "\">\n";
		echo "\t<meta property=\"og:type\" content=\"" . \esc_attr( $content['og_type'] ) . "\">\n";
		echo "\t<meta property=\"og:title\" content=\"" . \esc_attr( $content['title'] ) . "\">\n";
		echo "\t<meta property=\"og:description\" content=\"" . \esc_attr( $content['description'] ) . "\">\n";
		echo "\t<meta property=\"og:url\" content=\"" . \esc_url( $canonical_url ) . "\">\n";
		echo "\t<meta property=\"og:image\" content=\"" . \esc_url( $og_image ) . "\">\n";
		echo "\t<meta property=\"og:site_name\" content=\"" . \esc_attr( $site_name ) . "\">\n";
		echo "\t<meta name=\"twitter:card\" content=\"summary_large_image\">\n";
		echo "\t<meta name=\"twitter:title\" content=\"" . \esc_attr( $content['title'] ) . "\">\n";
		echo "\t<meta name=\"twitter:description\" content=\"" . \esc_attr( $content['description'] ) . "\">\n";
		echo "\t<meta name=\"twitter:image\" content=\"" . \esc_url( $og_image ) . "\">\n";
	}

	/**
	 * Override the document title for React-hosted routes.
	 *
	 * Hooked onto pre_get_document_title. Returns the per-route title from
	 * SEORouteContent when on a React route; returns the passed-in value
	 * unchanged for all other contexts (admin, REST, unrecognized paths).
	 *
	 * @param string $title The title WordPress would otherwise use.
	 * @return string Route-specific title on React routes; unchanged otherwise.
	 */
	public static function maybe_override_title( string $title ): string {
		if ( ! SiteRoutes::is_current_request_react_route() ) {
			return $title;
		}

		$route   = SiteRoutes::current_request_path();
		$content = SEORouteContent::get_content( $route );
		if ( null === $content ) {
			return $title;
		}

		return $content['title'];
	}
}
