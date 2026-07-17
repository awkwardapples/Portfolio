<?php
/**
 * Photo retention cron job (Step 5.13e, D3).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Cron;

use Agency\QuoteWizard\Submissions\PhotoStorage;

defined( 'ABSPATH' ) || exit;

/**
 * Daily WP-Cron job that deletes submission photos older than 6 months.
 *
 * Unlike PruneSubmissions (a Step-3D stub whose callback is never hooked —
 * see AUDIT-5.13e-cron-pattern.md), this is a real implementation: the event
 * 'goqw_photo_retention_cleanup' is scheduled in Activator and hooked to
 * self::run() in Plugin::boot().
 *
 * Only attachments tagged with PhotoStorage's '_goqw_photo' post meta are
 * candidates — this avoids any risk of deleting media the site owner
 * uploaded manually into the same year/month path.
 */
final class PhotoRetention {

	private const RETENTION_MONTHS = 6;

	/**
	 * Constructor.
	 *
	 * @param PhotoStorage $photo_storage  Used for delete_photo(); injectable for tests.
	 */
	public function __construct( private readonly PhotoStorage $photo_storage = new PhotoStorage() ) {}

	/**
	 * Entry point hooked to 'goqw_photo_retention_cleanup' (scheduled daily).
	 */
	public static function run(): void {
		( new self() )->execute();
	}

	/**
	 * Delete every submission photo older than the retention window.
	 */
	public function execute(): void {
		foreach ( $this->find_expired_attachment_ids() as $attachment_id ) {
			$this->photo_storage->delete_photo( $attachment_id );
		}
	}

	/**
	 * Query attachment IDs tagged as submission photos and older than
	 * RETENTION_MONTHS.
	 *
	 * @return int[]
	 */
	private function find_expired_attachment_ids(): array {
		$cutoff = \gmdate( 'Y-m-d H:i:s', strtotime( '-' . self::RETENTION_MONTHS . ' months' ) );

		$ids = \get_posts(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'posts_per_page' => -1,
				'fields'         => 'ids',
				'meta_key'       => PhotoStorage::PHOTO_META_KEY, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'date_query'     => array(
					array(
						'column' => 'post_date_gmt',
						'before' => $cutoff,
					),
				),
			)
		);

		return array_map( 'intval', $ids );
	}
}
