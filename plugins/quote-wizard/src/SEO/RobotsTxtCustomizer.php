<?php
/**
 * Customizes WordPress's robots.txt output.
 *
 * Adds Sitemap directive and standard disallows.
 *
 * Per ADR-0023 amendment (Step 5.10b), T5 Option B.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\SEO;

defined( 'ABSPATH' ) || exit;

/**
 * Customizes robots.txt via the robots_txt filter.
 *
 * Adds to WordPress's default robots.txt output:
 *   - Sitemap: <home_url>/sitemap.xml
 *
 * WordPress's default output already disallows /wp-admin/ and /wp-login.php,
 * so those are not duplicated here.
 *
 * When the site is not public (Settings > Reading > Search engine visibility
 * is set to discourage indexing), the Sitemap directive is omitted to respect
 * the private setting.
 */
final class RobotsTxtCustomizer {

	/**
	 * Register the filter hook.
	 */
	public static function register(): void {
		add_filter( 'robots_txt', array( __CLASS__, 'customize' ), 10, 2 );
	}

	/**
	 * Append Sitemap directive to WordPress's robots.txt output.
	 *
	 * @param string $output The default robots.txt output from WordPress.
	 * @param string $public '1' when the site allows indexing; '0' when private.
	 * @return string Customized robots.txt output.
	 */
	public static function customize( string $output, string $public ): string {
		if ( '0' === $public ) {
			return $output;
		}

		return $output . "\nSitemap: " . home_url( '/sitemap.xml' ) . "\n";
	}
}
