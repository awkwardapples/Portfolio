<?php
/**
 * Repository for wp_goqw_submissions rows.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Thin data-access layer for goqw_submissions.
 *
 * All write methods throw \RuntimeException on DB error so the controller
 * can return 500 rather than silently proceeding to forward. Read
 * operations return plain arrays; no domain objects cross this boundary.
 */
class SubmissionRepository {

	/**
	 * Constructor.
	 *
	 * @param \wpdb $wpdb  WordPress database object.
	 */
	public function __construct( private readonly \wpdb $wpdb ) {}

	/**
	 * Return the prefixed table name.
	 */
	private function table(): string {
		return $this->wpdb->prefix . 'goqw_submissions';
	}

	/**
	 * Insert a new submission row in 'persisted' state.
	 *
	 * @param array<string,mixed> $payload Validated and sanitised payload. Optional
	 *                                     `is_duplicate` (bool) and `duplicate_of` (int|null)
	 *                                     keys record duplicate-detection results (Step
	 *                                     5.13g, ADR-0028); both default to "not a duplicate".
	 *                                     Optional `consent_given` (bool) and
	 *                                     `consent_timestamp` (string|null) keys record consent
	 *                                     (Step 5.14, ADR-0029); both default to "no consent".
	 * @return int  Auto-increment row ID.
	 * @throws \RuntimeException  On DB insert failure.
	 */
	public function insert( array $payload ): int {
		$result = $this->wpdb->insert(
			$this->table(),
			array(
				'wizard_id'         => $payload['wizard_id'],
				'schema_version'    => $payload['schema_version'],
				'answers_json'      => $payload['answers_json'],
				'pricing_json'      => $payload['pricing_json'],
				'media_json'        => $payload['media_json'] ?? null,
				'client_timestamp'  => $payload['client_timestamp'],
				'status'            => 'persisted',
				'created_at'        => \current_time( 'mysql', true ),
				'is_duplicate'      => ! empty( $payload['is_duplicate'] ) ? 1 : 0,
				'duplicate_of'      => $payload['duplicate_of'] ?? null,
				'consent_given'     => ! empty( $payload['consent_given'] ) ? 1 : 0,
				'consent_timestamp' => $payload['consent_timestamp'] ?? null,
			),
			array( '%s', '%d', '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%d', '%s' )
		);

		if ( false === $result ) {
			throw new \RuntimeException( 'DB insert failed: ' . \esc_html( $this->wpdb->last_error ) );
		}

		return (int) $this->wpdb->insert_id;
	}

	/**
	 * Find the most recent non-duplicate submission whose contact_email or
	 * contact_phone answer matches the given normalized value(s), created at
	 * or after $window_start (Step 5.13g, ADR-0028, D1/D2).
	 *
	 * Uses JSON_UNQUOTE(JSON_EXTRACT(...)) rather than a bare JSON_EXTRACT()
	 * comparison — the latter compares against a quoted JSON string and
	 * relies on implicit cast semantics that vary by engine; unquoting first
	 * is unambiguous on both MySQL and MariaDB (AUDIT-5.13g-schema.md).
	 *
	 * A '' value for either argument omits that half of the OR from matching
	 * (an empty contact_email/contact_phone answer should never match rows
	 * whose JSON path is absent or empty).
	 *
	 * @param string $normalized_email  Lowercased, trimmed email, or '' to skip.
	 * @param string $normalized_phone  Digits-only phone, or '' to skip.
	 * @param string $window_start      MySQL datetime (UTC), inclusive lower bound.
	 * @return int|null  ID of the matching submission, or null when none found.
	 */
	public function find_recent_by_contact( string $normalized_email, string $normalized_phone, string $window_start ): ?int {
		// Local $wpdb alias, and {$wpdb->prefix}goqw_submissions inline (matching
		// Schema::table_name()'s suffix) rather than $this->table(): this is the
		// one pattern WordPress.DB.PreparedSQL recognises as safe for a dynamic
		// table name inside a prepare()'d template (AUDIT-5.13g-schema.md).
		$wpdb = $this->wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$row = $wpdb->get_row(
			$wpdb->prepare(
				"SELECT id FROM {$wpdb->prefix}goqw_submissions
				WHERE is_duplicate = 0
				AND created_at >= %s
				AND (
					( %s <> '' AND LOWER( JSON_UNQUOTE( JSON_EXTRACT( answers_json, '\$.contact_email' ) ) ) = %s )
					OR
					( %s <> '' AND JSON_UNQUOTE( JSON_EXTRACT( answers_json, '\$.contact_phone' ) ) = %s )
				)
				ORDER BY created_at DESC
				LIMIT 1",
				$window_start,
				$normalized_email,
				$normalized_email,
				$normalized_phone,
				$normalized_phone
			)
		);

		return null !== $row ? (int) $row->id : null;
	}

	/**
	 * Mark a row as successfully forwarded.
	 *
	 * @param int $submission_id  Row ID.
	 */
	public function mark_forwarded( int $submission_id ): void {
		$this->wpdb->update(
			$this->table(),
			array(
				'status'       => 'forwarded',
				'forwarded_at' => \current_time( 'mysql', true ),
			),
			array( 'id' => $submission_id ),
			array( '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Mark a row as forward-failed and record the error.
	 *
	 * @param int    $submission_id  Row ID.
	 * @param string $error_message  Short error description (truncated to 1000 chars).
	 */
	public function mark_forward_failed( int $submission_id, string $error_message ): void {
		$this->wpdb->update(
			$this->table(),
			array(
				'status'               => 'forward_failed',
				'forward_error'        => substr( $error_message, 0, 1000 ),
				'forward_attempted_at' => \current_time( 'mysql', true ),
			),
			array( 'id' => $submission_id ),
			array( '%s', '%s', '%s' ),
			array( '%d' )
		);
	}

	/**
	 * Delete every submission row created before the given cutoff (Step
	 * 5.14, data retention). Used by Cron\PruneSubmissions; the cutoff is
	 * computed by the caller from Settings::retention_days().
	 *
	 * @param string $cutoff  MySQL datetime (UTC), exclusive upper bound.
	 * @return int  Number of rows deleted.
	 */
	public function delete_older_than( string $cutoff ): int {
		// Local $wpdb alias, and {$wpdb->prefix}goqw_submissions inline, matching
		// find_recent_by_contact() — the one pattern WordPress.DB.PreparedSQL
		// recognises as safe for a dynamic table name inside prepare().
		$wpdb = $this->wpdb;

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$deleted = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->prefix}goqw_submissions WHERE created_at < %s",
				$cutoff
			)
		);

		return is_int( $deleted ) ? $deleted : 0;
	}
}
