<?php
/**
 * Site Root page lifecycle.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Routing;

defined( 'ABSPATH' ) || exit;

/**
 * Manages the lifecycle of the single WordPress page that backs all recognized
 * site routes. Idempotent: ensure() may be called any number of times safely.
 *
 * Self-healing: if the stored option points to a deleted page, ensure() creates
 * a new one and updates the option.
 */
class SiteRootPage {

	/**
	 * WordPress option key that stores the page ID.
	 */
	public const OPTION_KEY = 'goqw_site_root_page_id';

	/**
	 * Post slug for the managed page.
	 */
	public const SLUG = 'goqw-site-root';

	/**
	 * Post title shown in wp-admin's page list.
	 */
	public const TITLE = 'Site';

	/**
	 * Ensure the Site Root page exists and return its ID.
	 *
	 * - If the option stores a valid, published page ID: return it (no-op).
	 * - Otherwise: create a new page, update the option, return the new ID.
	 *
	 * @return int The page ID (always > 0 on success).
	 * @throws \RuntimeException When page creation fails.
	 */
	public function ensure(): int {
		$stored_id = (int) \get_option( self::OPTION_KEY, 0 );

		if ( $stored_id > 0 ) {
			$post = \get_post( $stored_id );
			if (
				$post instanceof \WP_Post &&
				$post->post_status === 'publish' &&
				$post->post_type === 'page'
			) {
				return $stored_id;
			}
		}

		$page_id = \wp_insert_post(
			array(
				'post_title'     => self::TITLE,
				'post_name'      => self::SLUG,
				'post_status'    => 'publish',
				'post_type'      => 'page',
				'post_content'   => '',
				'comment_status' => 'closed',
				'ping_status'    => 'closed',
			),
			true
		);

		if ( \is_wp_error( $page_id ) ) {
			throw new \RuntimeException(
				'Failed to create Site Root page: ' . $page_id->get_error_message() // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
			);
		}

		\update_option( self::OPTION_KEY, (int) $page_id );
		return (int) $page_id;
	}

	/**
	 * Return the stored page ID, or 0 if none is recorded.
	 *
	 * Does NOT verify the page still exists. Callers that need self-healing
	 * should use ensure() instead.
	 */
	public function id(): int {
		return (int) \get_option( self::OPTION_KEY, 0 );
	}

	/**
	 * Delete the Site Root page and remove the option (uninstall only).
	 */
	public function delete(): void {
		$id = $this->id();
		if ( $id > 0 ) {
			\wp_delete_post( $id, true );
		}
		\delete_option( self::OPTION_KEY );
	}
}
