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
 * The schema is the single durable record of every lead. Per the architecture
 * (docs/02-architecture.md §5), a submission is written here BEFORE any third
 * party (Make.com, HubSpot, email) is contacted. This is what makes the
 * "no silent lead loss" guarantee operationally true.
 */
final class Schema {

	/**
	 * Return the unprefixed table name.
	 */
	public static function table_name(): string {
		global $wpdb;
		return $wpdb->prefix . 'goqw_submissions';
	}

	/**
	 * SQL for creating / updating the submissions table.
	 *
	 * This SQL MUST satisfy dbDelta's formatting requirements:
	 *   - Each column on its own line
	 *   - Two spaces between PRIMARY KEY and its column
	 *   - No IF NOT EXISTS
	 *   - Indexes declared inline as KEY (not ALTER TABLE later)
	 *
	 * Column rationale documented in docs/02-architecture.md §5 and Step 3D
	 * plan §1.5. Money columns are stored as INT UNSIGNED in pence to avoid
	 * floating-point money bugs. IPs are VARBINARY(16) to support IPv6 and
	 * be GDPR-friendlier than plain text.
	 */
	public static function submissions_table_sql(): string {
		global $wpdb;

		$table_name      = self::table_name();
		$charset_collate = $wpdb->get_charset_collate();

		return "CREATE TABLE {$table_name} (
			id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			created_at DATETIME NOT NULL,
			updated_at DATETIME NOT NULL,
			status VARCHAR(32) NOT NULL DEFAULT 'pending',
			trade VARCHAR(64) NOT NULL,
			contact_name VARCHAR(191) NULL,
			contact_email VARCHAR(191) NULL,
			contact_phone VARCHAR(64) NULL,
			contact_postcode VARCHAR(16) NULL,
			estimate_low INT UNSIGNED NULL,
			estimate_high INT UNSIGNED NULL,
			currency CHAR(3) NOT NULL DEFAULT 'GBP',
			payload LONGTEXT NOT NULL,
			image_ids TEXT NULL,
			forwarded_at DATETIME NULL,
			forward_error TEXT NULL,
			ip_address VARBINARY(16) NULL,
			user_agent VARCHAR(512) NULL,
			consent_given TINYINT(1) NOT NULL DEFAULT 0,
			consent_text TEXT NULL,
			PRIMARY KEY  (id),
			KEY idx_created_at (created_at),
			KEY idx_status (status),
			KEY idx_contact_email (contact_email)
		) {$charset_collate};";
	}
}
