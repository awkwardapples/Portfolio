<?php
/**
 * Init-time self-healing for the Site Root page.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Recreates the Site Root page on `init` if a site admin has manually deleted
 * it. Cheap: one option read + one post lookup per frontend page load.
 */
final class SelfHealer {

	/**
	 * Constructor.
	 *
	 * @param SiteRootPage $page The Site Root page manager.
	 */
	public function __construct( private readonly SiteRootPage $page ) {}

	/**
	 * Check whether the Site Root page still exists; recreate it if not.
	 * Skip in non-frontend contexts (admin, REST, CLI, cron).
	 */
	public function check(): void {
		if ( \is_admin() ) {
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

		$stored_id = $this->page->id();
		if ( $stored_id <= 0 ) {
			$this->page->ensure();
			return;
		}

		$post = \get_post( $stored_id );
		if ( ! ( $post instanceof \WP_Post ) || $post->post_status !== 'publish' ) {
			$this->page->ensure();
		}
	}
}
