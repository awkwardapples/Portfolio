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
	 * @param array<string,mixed> $payload Validated and sanitised payload.
	 * @return int  Auto-increment row ID.
	 * @throws \RuntimeException  On DB insert failure.
	 */
	public function insert( array $payload ): int {
		$result = $this->wpdb->insert(
			$this->table(),
			array(
				'wizard_id'        => $payload['wizard_id'],
				'schema_version'   => $payload['schema_version'],
				'answers_json'     => $payload['answers_json'],
				'pricing_json'     => $payload['pricing_json'],
				'client_timestamp' => $payload['client_timestamp'],
				'status'           => 'persisted',
				'created_at'       => current_time( 'mysql', true ),
			),
			array( '%s', '%d', '%s', '%s', '%s', '%s', '%s' )
		);

		if ( false === $result ) {
			throw new \RuntimeException( 'DB insert failed: ' . esc_html( $this->wpdb->last_error ) );
		}

		return (int) $this->wpdb->insert_id;
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
				'forwarded_at' => current_time( 'mysql', true ),
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
				'forward_attempted_at' => current_time( 'mysql', true ),
			),
			array( 'id' => $submission_id ),
			array( '%s', '%s', '%s' ),
			array( '%d' )
		);
	}
}
