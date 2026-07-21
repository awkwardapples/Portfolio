<?php
/**
 * Saves validated submission photos to the WordPress media library.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Decodes base64 photo data (already validated by MediaValidator, ADR-0026)
 * to a temp file, routes it through wp_handle_sideload into the
 * /wp-content/uploads/goqw/YEAR/MONTH/ subdirectory (D1), and registers it
 * as a WordPress attachment so it has a stable public URL (D2).
 *
 * Uses wp_handle_sideload(), not wp_handle_upload(), because the temp file
 * was written by this class via file_put_contents(), not received as an
 * HTTP $_FILES upload — wp_handle_upload() requires is_uploaded_file() to
 * return true, which is never the case here (Step 5.14.3, ADR-0032).
 *
 * This class does not re-validate MIME type, magic bytes, or dimensions —
 * that is MediaValidator's job and must run first (see
 * AUDIT-5.13e-media-validator.md). store_photo() only handles the mechanics
 * of getting already-trusted bytes onto disk and into the media library.
 */
class PhotoStorage {

	private const UPLOAD_SUBDIR = 'goqw';

	/**
	 * Explicit MIME allowlist passed to wp_handle_sideload(), matching
	 * MediaValidator's own allowlist (Step 5.14.3) — bypasses any
	 * theme/plugin-registered upload_mimes filter that might otherwise
	 * restrict or expand what this call accepts.
	 */
	private const ALLOWED_UPLOAD_MIMES = array(
		'jpg|jpeg|jpe' => 'image/jpeg',
		'png'          => 'image/png',
		'webp'         => 'image/webp',
		'gif'          => 'image/gif',
	);

	/**
	 * Post meta key tagging every attachment this class creates, so
	 * PhotoRetention can find them without guessing from file paths.
	 */
	public const PHOTO_META_KEY = '_goqw_photo';

	/**
	 * MIME type to expected file extension. Used to correct a filename whose
	 * extension doesn't match its actual content before wp_handle_sideload() —
	 * WordPress's wp_check_filetype_and_ext() rejects that mismatch outright
	 * (Step 5.14.2). The client already sends a corrected name (see
	 * AUDIT-5.14.2-photo-preparation.md), but the server cannot trust that; this
	 * is the safety net for a modified client, a replayed request, or a future
	 * client bug.
	 */
	private const MIME_TO_EXTENSION = array(
		'image/jpeg' => 'jpg',
		'image/jpg'  => 'jpg', // Some clients send this non-standard variant.
		'image/png'  => 'png',
		'image/webp' => 'webp',
		'image/gif'  => 'gif',
	);

	/**
	 * Process one photo and return a storage result.
	 *
	 * @param  string $base64_data    Raw or data-URL-prefixed base64.
	 * @param  string $mime_type      Claimed MIME type (already verified by MediaValidator).
	 * @param  string $original_name  Original filename, used only for the attachment title.
	 * @return array{success: bool, url?: string, attachmentId?: int, error?: string}
	 */
	public function store_photo( string $base64_data, string $mime_type, string $original_name ): array {
		// Must run before write_temp_file(): wp_tempnam() lives in the same
		// wp-admin/includes/file.php this method loads, and REST requests don't
		// autoload it. Loading it after the wp_tempnam() call (as a prior
		// revision did) is too late — see AUDIT-5.14.1-admin-includes.md.
		$this->ensure_upload_functions_loaded();

		$raw_bytes = $this->decode( $base64_data );
		if ( null === $raw_bytes ) {
			return array(
				'success' => false,
				'error'   => 'invalid_encoding',
			);
		}

		$tmp_path = $this->write_temp_file( $raw_bytes );
		if ( null === $tmp_path ) {
			return array(
				'success' => false,
				'error'   => 'temp_write_failed',
			);
		}

		$corrected_name = $this->correct_filename_extension(
			'' !== $original_name ? $original_name : 'photo',
			$mime_type
		);

		$file = array(
			'name'     => \sanitize_file_name( $corrected_name ),
			'type'     => $mime_type,
			'tmp_name' => $tmp_path,
			'error'    => 0,
			'size'     => strlen( $raw_bytes ),
		);

		\add_filter( 'upload_dir', array( $this, 'filter_upload_dir' ) );
		$result = \wp_handle_sideload(
			$file,
			array(
				'test_form' => false,
				'mimes'     => self::ALLOWED_UPLOAD_MIMES,
			)
		);
		\remove_filter( 'upload_dir', array( $this, 'filter_upload_dir' ) );

		if ( isset( $result['error'] ) ) {
			$this->delete_temp_file( $tmp_path );
			return array(
				'success' => false,
				'error'   => (string) $result['error'],
			);
		}

		$attachment_id = \wp_insert_attachment(
			array(
				'post_mime_type' => $result['type'],
				'post_title'     => \sanitize_file_name( $corrected_name ),
				'post_content'   => '',
				'post_status'    => 'inherit',
			),
			$result['file'],
			0,
			true
		);

		if ( \is_wp_error( $attachment_id ) ) {
			return array(
				'success' => false,
				'error'   => 'attachment_insert_failed',
			);
		}

		// Tags every attachment PhotoStorage creates so PhotoRetention can find
		// them without guessing from file paths (ADR-0026).
		\update_post_meta( $attachment_id, self::PHOTO_META_KEY, 1 );

		$metadata = \wp_generate_attachment_metadata( $attachment_id, $result['file'] );
		\wp_update_attachment_metadata( $attachment_id, $metadata );

		return array(
			'success'      => true,
			'url'          => (string) \wp_get_attachment_url( $attachment_id ),
			'attachmentId' => (int) $attachment_id,
		);
	}

	/**
	 * Ensure a filename's extension matches its actual MIME type, correcting it
	 * if not (Step 5.14.2).
	 *
	 * For an unrecognized MIME type, the filename is returned unchanged —
	 * MediaValidator's allowlist check already rejects any submission before it
	 * reaches PhotoStorage, so this path is unreachable in practice for a
	 * genuine request; it exists so this method has a defined, non-throwing
	 * result for every input.
	 *
	 * @param  string $original_name  Client-supplied filename.
	 * @param  string $mime_type      Claimed MIME type (already verified by MediaValidator).
	 */
	private function correct_filename_extension( string $original_name, string $mime_type ): string {
		$expected_ext = self::MIME_TO_EXTENSION[ strtolower( $mime_type ) ] ?? null;
		if ( null === $expected_ext ) {
			return $original_name;
		}

		$current_ext = strtolower( pathinfo( $original_name, PATHINFO_EXTENSION ) );
		if ( $current_ext === $expected_ext ) {
			return $original_name;
		}

		$base_name = pathinfo( $original_name, PATHINFO_FILENAME );
		return ( '' !== $base_name ? $base_name : 'photo' ) . '.' . $expected_ext;
	}

	/**
	 * Delete an attachment by ID. Used for orphan cleanup (D6) and retention (D3).
	 *
	 * @param int $attachment_id  WordPress attachment post ID.
	 */
	public function delete_photo( int $attachment_id ): bool {
		return false !== \wp_delete_attachment( $attachment_id, true );
	}

	/**
	 * Load the wp-admin includes that declare wp_handle_sideload() and
	 * wp_generate_attachment_metadata() — not autoloaded outside wp-admin
	 * (see AUDIT-5.13e-wp-media-integration.md). Extracted to its own
	 * protected method so tests can override it with a no-op, the same
	 * pattern SubmissionRepository/Forwarder test doubles use to bypass
	 * infrastructure they don't need to exercise.
	 */
	protected function ensure_upload_functions_loaded(): void {
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	/**
	 * Upload_dir filter callback — routes uploads into goqw/YEAR/MONTH/ (D1).
	 * Added immediately before wp_handle_sideload() and removed immediately after,
	 * so it never affects uploads outside this class.
	 *
	 * @param  array<string,mixed> $dirs  The array wp_upload_dir() normally returns.
	 * @return array<string,mixed>
	 */
	public function filter_upload_dir( array $dirs ): array {
		$dirs['basedir'] = $dirs['basedir'] . '/' . self::UPLOAD_SUBDIR;
		$dirs['baseurl'] = $dirs['baseurl'] . '/' . self::UPLOAD_SUBDIR;
		$dirs['path']    = $dirs['basedir'] . $dirs['subdir'];
		$dirs['url']     = $dirs['baseurl'] . $dirs['subdir'];
		return $dirs;
	}

	/**
	 * Decode base64 (with optional data URL prefix) to raw bytes.
	 *
	 * @param string $base64_data  Raw or data-URL-prefixed base64 string.
	 */
	private function decode( string $base64_data ): ?string {
		$raw_base64 = (string) preg_replace( '/^data:[^;]+;base64,/i', '', $base64_data );
		if ( '' === $raw_base64 ) {
			return null;
		}

		$decoded = base64_decode( $raw_base64, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		return false === $decoded ? null : $decoded;
	}

	/**
	 * Write raw bytes to a temp file. Returns null on failure.
	 *
	 * @param string $raw_bytes  Decoded photo bytes.
	 */
	private function write_temp_file( string $raw_bytes ): ?string {
		$tmp_path = \wp_tempnam();
		if ( '' === $tmp_path ) {
			return null;
		}

		$written = file_put_contents( $tmp_path, $raw_bytes ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		if ( false === $written ) {
			return null;
		}

		return $tmp_path;
	}

	/**
	 * Delete a temp file if it still exists (failure paths only — on success
	 * wp_handle_sideload() moves the file, so nothing remains at $tmp_path).
	 *
	 * @param string $tmp_path  Path to the temp file.
	 */
	private function delete_temp_file( string $tmp_path ): void {
		if ( file_exists( $tmp_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $tmp_path );
		}
	}
}
