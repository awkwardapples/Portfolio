<?php
/**
 * Image upload handler.
 *
 * STUB FOR STEP 3D — real upload pipeline lands in Step 5.1.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Validates and sideloads uploaded images into the WordPress media library.
 *
 * Security requirements (per ADR-0007, Step 3D operational constraint #3):
 *
 *   1. MIME type allowlist: image/jpeg, image/png, image/webp ONLY.
 *      Server-side detection via finfo_file, not the client-supplied header.
 *   2. Hard size cap: 8MB per file pre-compression (the React app aims for
 *      <500KB after compression but we don't trust the client).
 *   3. Maximum 5 files per submission.
 *   4. Filename sanitisation: sanitize_file_name() + UUID prefix to prevent
 *      collision-based attacks and to never echo the user's filename.
 *   5. Files routed through wp_handle_sideload, which performs WordPress's
 *      own MIME re-check and rejects executable types.
 *   6. EXIF data: optionally stripped (defer to Step 6 for "polish").
 *   7. Images are stored in the standard WP uploads dir, returned as media
 *      library attachment IDs (not raw paths) for the Repository to persist.
 *
 * Real implementation + tests in Step 5.1.
 */
final class ImageHandler {

	/**
	 * Allowed MIME types. Used by the real implementation and exposed here
	 * so tests can assert the allowlist hasn't drifted.
	 *
	 * @var list<string>
	 */
	public const ALLOWED_MIME_TYPES = array(
		'image/jpeg',
		'image/png',
		'image/webp',
	);

	public const MAX_FILE_SIZE_BYTES      = 8 * 1024 * 1024;
	public const MAX_FILES_PER_SUBMISSION = 5;

	/**
	 * Sideload uploaded files into the media library.
	 *
	 * @param array<int, array{name: string, tmp_name: string, type: string, size: int, error: int}> $files Files as received via the WP REST request (matches PHP's $_FILES shape).
	 * @return never
	 *
	 * @throws \LogicException Always — this is a stub for Step 5.1.
	 */
	public static function sideload( array $files ): never {
		unset( $files );

		throw new \LogicException(
			'ImageHandler::sideload is not implemented yet — see Step 5.1.'
		);
	}
}
