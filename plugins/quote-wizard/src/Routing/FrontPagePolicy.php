<?php
/**
 * Front-page configuration policy.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Encapsulates the front-page-setting policy (ADR-0010 amendment, Step 5.1).
 *
 * On activation:
 *   - If no front page is configured, set the Site Root page as the front page.
 *   - If a front page IS configured, leave it alone and queue a one-shot admin
 *     notice describing the manual step required.
 *
 * "No front page configured" means show_on_front === 'posts' OR
 * (show_on_front === 'page' AND page_on_front === 0).
 */
final class FrontPagePolicy {

	/**
	 * Transient key for the one-shot admin notice.
	 */
	public const NOTICE_TRANSIENT = 'goqw_front_page_notice';

	/**
	 * Constructor.
	 *
	 * @param SiteRootPage $page The Site Root page manager.
	 */
	public function __construct( private readonly SiteRootPage $page ) {}

	/**
	 * Apply the policy on activation. Idempotent.
	 *
	 * @return bool True if the front page was set; false if left untouched.
	 */
	public function apply_on_activation(): bool {
		$site_root_id  = $this->page->ensure();
		$show_on_front = (string) \get_option( 'show_on_front', 'posts' );
		$page_on_front = (int) \get_option( 'page_on_front', 0 );

		$no_front_page_configured =
			$show_on_front === 'posts' ||
			( $show_on_front === 'page' && $page_on_front === 0 );

		if ( $no_front_page_configured ) {
			\update_option( 'show_on_front', 'page' );
			\update_option( 'page_on_front', $site_root_id );
			return true;
		}

		// Existing front page is configured by the site owner — leave it alone.
		\set_transient(
			self::NOTICE_TRANSIENT,
			array(
				'site_root_id' => $site_root_id,
				'existing_id'  => $page_on_front,
			),
			DAY_IN_SECONDS
		);
		return false;
	}

	/**
	 * Output the admin notice if the transient is set. Called on admin_notices.
	 */
	public function maybe_render_notice(): void {
		$data = \get_transient( self::NOTICE_TRANSIENT );
		if ( $data === false ) {
			return;
		}
		if ( ! \current_user_can( 'manage_options' ) ) {
			return;
		}

		$site_root_id = (int) ( $data['site_root_id'] ?? 0 );
		$edit_link    = $site_root_id > 0 ? \get_edit_post_link( $site_root_id ) : '';

		echo '<div class="notice notice-warning is-dismissible">';
		echo '<p><strong>Quote Wizard:</strong> A front page is already configured for this site. ';
		echo 'To enable the wizard\'s site routes (Home, Services, Our Work, Contact, Quote), ';
		echo 'set the front page to the Site Root page in Settings &rarr; Reading.</p>';
		if ( $edit_link !== '' ) {
			printf(
				'<p><a href="%1$s">Open Reading Settings</a> &middot; <a href="%2$s">View Site Root page</a></p>',
				\esc_url( \admin_url( 'options-reading.php' ) ),
				\esc_url( $edit_link )
			);
		}
		echo '</div>';

		// One-shot: delete so it only appears once per activation cycle.
		\delete_transient( self::NOTICE_TRANSIENT );
	}
}
