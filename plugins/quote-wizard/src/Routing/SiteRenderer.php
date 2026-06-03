<?php
/**
 * Renders the React mount node on the Site Root page.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

use Agency\QuoteWizard\Frontend\AssetLoader;

defined( 'ABSPATH' ) || exit;

/**
 * Replaces the Site Root page's (empty) content with the React mount node
 * and enqueues the wizard bundle via the existing AssetLoader mechanism.
 *
 * A no-cache header is sent to prevent page-caching plugins from serving
 * a stale SPA shell with the wrong data-initial-path attribute.
 */
final class SiteRenderer {

	/**
	 * Constructor.
	 *
	 * @param SiteRootPage $page Site Root page manager.
	 */
	public function __construct( private readonly SiteRootPage $page ) {}

	/**
	 * Filter callback for 'the_content' (priority 5).
	 *
	 * If we are rendering the Site Root page in the main loop, replace
	 * content with the React mount node and enqueue bundle assets.
	 *
	 * @param  string $content  Original post content (empty for Site Root).
	 * @return string           Modified content or original if not applicable.
	 */
	public function filter_content( string $content ): string {
		if ( ! $this->is_site_root_in_main_loop() ) {
			return $content;
		}

		AssetLoader::ensure_enqueued();

		if ( ! headers_sent() ) {
			header( 'Cache-Control: no-cache, must-revalidate, max-age=0' );
		}

		$initial_path = esc_attr( $this->current_request_path() );
		return sprintf(
			'<div id="qw-root" data-initial-path="%s"></div>',
			$initial_path
		);
	}

	/**
	 * Whether the current the_content call is rendering the Site Root page
	 * inside the main loop (not a widget, query, or admin context).
	 */
	private function is_site_root_in_main_loop(): bool {
		if ( is_admin() ) {
			return false;
		}
		if ( ! in_the_loop() ) {
			return false;
		}
		$site_root_id = $this->page->id();
		if ( $site_root_id <= 0 ) {
			return false;
		}
		return (int) get_the_ID() === $site_root_id;
	}

	/**
	 * Extract the path portion of the current request URI.
	 */
	private function current_request_path(): string {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.WP.AlternativeFunctions.parse_url_parse_url
		$uri = (string) ( $_SERVER['REQUEST_URI'] ?? '/' );
		// phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		$path = parse_url( $uri, PHP_URL_PATH );
		return is_string( $path ) ? $path : '/';
	}
}
