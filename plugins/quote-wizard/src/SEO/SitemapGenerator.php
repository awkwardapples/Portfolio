<?php
/**
 * Sitemap.xml generator.
 *
 * Generates a custom sitemap at /sitemap.xml listing the 5 React routes.
 * Replaces WordPress core sitemap which is disabled via wp_sitemaps_enabled.
 *
 * Per ADR-0023 amendment (Step 5.10b), T3 Option A, T4 Option B.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\SEO;

defined( 'ABSPATH' ) || exit;

/**
 * Generates and serves /sitemap.xml for the 5 React-hosted routes.
 *
 * Approach:
 *   1. Disable WP core sitemap (wp_sitemaps_enabled filter).
 *   2. Register custom rewrite rule for /sitemap.xml at 'top' priority.
 *   3. Serve custom XML when the goqw_sitemap query var is present.
 *
 * Routes listed (T4 Option B — priority + changefreq):
 *   /         priority 1.0  changefreq monthly
 *   /quote    priority 0.9  changefreq monthly
 *   /services priority 0.8  changefreq monthly
 *   /our-work priority 0.7  changefreq monthly
 *   /contact  priority 0.7  changefreq monthly
 */
final class SitemapGenerator {

	/**
	 * Per-route sitemap metadata ordered by priority descending.
	 *
	 * @var array<string, array{priority: string, changefreq: string}>
	 */
	private const ROUTE_METADATA = array(
		'/'         => array(
			'priority'   => '1.0',
			'changefreq' => 'monthly',
		),
		'/quote'    => array(
			'priority'   => '0.9',
			'changefreq' => 'monthly',
		),
		'/services' => array(
			'priority'   => '0.8',
			'changefreq' => 'monthly',
		),
		'/our-work' => array(
			'priority'   => '0.7',
			'changefreq' => 'monthly',
		),
		'/contact'  => array(
			'priority'   => '0.7',
			'changefreq' => 'monthly',
		),
	);

	/**
	 * Register hooks: disable WP core sitemap, add rewrite rule, serve.
	 */
	public static function register(): void {
		add_filter( 'wp_sitemaps_enabled', '__return_false' );
		add_action( 'init', array( __CLASS__, 'add_rewrite_rule' ) );
		add_filter( 'query_vars', array( __CLASS__, 'add_query_var' ) );
		add_action( 'template_redirect', array( __CLASS__, 'maybe_serve_sitemap' ), 1 );
	}

	/**
	 * Register the /sitemap.xml rewrite rule.
	 *
	 * Priority 'top' ensures this matches before React route rewrites so
	 * /sitemap.xml is never handled by the React SPA template.
	 */
	public static function add_rewrite_rule(): void {
		add_rewrite_rule( '^sitemap\.xml$', 'index.php?goqw_sitemap=1', 'top' );
	}

	/**
	 * Add the goqw_sitemap query var so WordPress recognizes it.
	 *
	 * @param string[] $vars Existing query vars.
	 * @return string[]
	 */
	public static function add_query_var( array $vars ): array {
		$vars[] = 'goqw_sitemap';
		return $vars;
	}

	/**
	 * Serve the sitemap.xml response when the request matches.
	 *
	 * Exits after sending the response so WordPress does not proceed with
	 * normal template loading.
	 */
	public static function maybe_serve_sitemap(): void {
		if ( ! (bool) get_query_var( 'goqw_sitemap' ) ) {
			return;
		}

		header( 'Content-Type: application/xml; charset=' . get_bloginfo( 'charset' ) );
		header( 'X-Robots-Tag: noindex' );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo self::generate_sitemap_xml();
		exit;
	}

	/**
	 * Generate the sitemap XML string.
	 *
	 * Public for unit testing; not intended for direct external use.
	 */
	public static function generate_sitemap_xml(): string {
		$lastmod = self::get_lastmod_date();

		$xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
		$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

		foreach ( self::ROUTE_METADATA as $path => $metadata ) {
			$xml .= "  <url>\n";
			$xml .= '    <loc>' . esc_url( home_url( $path ) ) . "</loc>\n";
			$xml .= '    <lastmod>' . esc_html( $lastmod ) . "</lastmod>\n";
			$xml .= '    <changefreq>' . esc_html( $metadata['changefreq'] ) . "</changefreq>\n";
			$xml .= '    <priority>' . esc_html( $metadata['priority'] ) . "</priority>\n";
			$xml .= "  </url>\n";
		}

		$xml .= '</urlset>' . "\n";
		return $xml;
	}

	/**
	 * Get the last-modified date for the sitemap.
	 *
	 * Returns the goqw_sitemap_lastmod option when set (ISO 8601 date string);
	 * otherwise today's date in Y-m-d format.
	 */
	private static function get_lastmod_date(): string {
		$override = get_option( 'goqw_sitemap_lastmod' );
		if ( is_string( $override ) && '' !== $override ) {
			return $override;
		}
		return gmdate( 'Y-m-d' );
	}
}
