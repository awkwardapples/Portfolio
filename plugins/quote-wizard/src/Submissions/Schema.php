<?php
/**
 * Database schema for the submissions table.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Defines the goqw_submissions table.
 *
 * The schema is the single durable record of every lead (ADR-0001).
 * A submission row is written HERE before any forward attempt —
 * this is what makes "no silent lead loss" operationally true.
 *
 * Status lifecycle:
 *   persisted      Row inserted; forward not yet attempted.
 *   forwarded      Forward to Make.com succeeded.
 *   forward_failed Forward attempted but returned a non-2xx or timed out.
 *                  The row is recoverable; admin tooling can replay.
 */
final class Schema {

	/**
	 * Return the prefixed table name.
	 */
	public static function table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'goqw_submissions';
	}

	/**
	 * SQL for creating / updating the submissions table via dbDelta.
	 *
	 * Requirements for dbDelta (must be exact):
	 *   - Each column on its own line.
	 *   - Two spaces between PRIMARY KEY and its column list.
	 *   - No IF NOT EXISTS.
	 *   - Indexes declared inline as KEY (not ALTER TABLE).
	 *
	 * Note: dbDelta adds missing columns to existing tables but does NOT
	 * drop or rename columns. On a fresh install the table is created as
	 * below; on an existing dev install the new columns are added and the
	 * old Phase-3 columns (trade, contact_*, payload, …) remain but are
	 * unused. For a clean slate deactivate, drop the table, and reactivate.
	 */
	public static function submissions_table_sql(): string {
		global $wpdb;

		$table_name      = self::table_name();
		$charset_collate = $wpdb->get_charset_collate();

		return "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			wizard_id VARCHAR(191) NOT NULL,
			schema_version INT NOT NULL DEFAULT 1,
			answers_json LONGTEXT NOT NULL,
			pricing_json LONGTEXT NULL,
			client_timestamp VARCHAR(64) NOT NULL DEFAULT '',
			status VARCHAR(32) NOT NULL DEFAULT 'persisted',
			created_at DATETIME NOT NULL,
			forwarded_at DATETIME NULL,
			forward_attempted_at DATETIME NULL,
			forward_error TEXT NULL,
			PRIMARY KEY  (id),
			KEY idx_created_at (created_at),
			KEY idx_status (status),
			KEY idx_wizard_id (wizard_id)
		) {$charset_collate};";
	}
}
