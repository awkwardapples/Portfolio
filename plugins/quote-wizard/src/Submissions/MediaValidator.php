<?php
/**
 * Validates media (photo) entries embedded in submission answers.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Server-side validation for photo answers (ADR-0015 amendment, Step 4.8).
 *
 * Validation order (short-circuit on first failure, cheapest first):
 *   1. Per-photo encoded size ≤ MAX_PHOTO_BYTES
 *   2. Running total ≤ MAX_TOTAL_BYTES
 *   3. MIME claim in allowlist
 *   4. Base64 decode succeeds
 *   5. finfo magic-byte matches claimed MIME
 *   6. getimagesizefromstring confirms valid image, dimensions ≤ MAX_DIMENSION
 *
 * Steps 5–6 are intentionally last because base64 decoding is required and
 * relatively expensive on large payloads. The cheap size and MIME checks
 * eliminate obviously bad inputs before any decoding occurs.
 *
 * Magic-byte verification (step 5) is mandatory: a file renamed from
 * .svg to .jpg would pass allowlist checks but is caught here. Skipping it
 * is a content-type spoofing vulnerability.
 */
class MediaValidator {

	private const ALLOWED_MIMES = array( 'image/jpeg', 'image/png', 'image/webp' );

	/**
	 * Constructor.
	 *
	 * Limits are injectable so tests can use small values without generating
	 * multi-megabyte image fixtures. Production code uses the defaults.
	 *
	 * @param int $max_photo_bytes  Max encoded bytes per photo (default 5 MB).
	 * @param int $max_total_bytes  Max total encoded bytes across all photos (default 10 MB).
	 * @param int $max_dimension    Max image dimension in pixels per side (default 12 000).
	 */
	public function __construct(
		private readonly int $max_photo_bytes = 5 * 1024 * 1024,
		private readonly int $max_total_bytes = 10 * 1024 * 1024,
		private readonly int $max_dimension = 12000,
	) {}

	/**
	 * Validate all media entries in the answers map.
	 *
	 * @param  array<string,mixed> $answers  Decoded answers from the submission payload.
	 * @return array{ ok: bool, issues: list<array{fileIndex: int, code: string}> }
	 */
	public function validate( array $answers ): array {
		$running_total = 0;
		$file_index    = 0;

		foreach ( $answers as $value ) {
			if ( ! is_array( $value ) || ! isset( $value['files'] ) || ! is_array( $value['files'] ) ) {
				continue;
			}

			foreach ( $value['files'] as $file ) {
				$result = $this->validate_file( $file, $file_index, $running_total );
				if ( $result !== null ) {
					return array(
						'ok'     => false,
						'issues' => array( $result ),
					);
				}

				$base64         = $file['dataBase64'] ?? '';
				$running_total += strlen( (string) $base64 );
				++$file_index;
			}
		}

		return array(
			'ok'     => true,
			'issues' => array(),
		);
	}

	/**
	 * Validate a single file entry. Returns an issue array on failure, null on success.
	 *
	 * @param  mixed $file           The file entry from the submission.
	 * @param  int   $index          Zero-based file index for error reporting.
	 * @param  int   $running_total  Cumulative encoded bytes validated so far.
	 * @return array{fileIndex: int, code: string}|null
	 */
	private function validate_file( mixed $file, int $index, int $running_total ): ?array {
		if ( ! is_array( $file ) ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'invalid_entry',
			);
		}

		$base64 = isset( $file['dataBase64'] ) ? (string) $file['dataBase64'] : '';

		// 1. Per-photo size (cheap: just measure the string).
		if ( strlen( $base64 ) > $this->max_photo_bytes ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'too_large',
			);
		}

		// 2. Running total.
		if ( $running_total + strlen( $base64 ) > $this->max_total_bytes ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'total_too_large',
			);
		}

		// 3. MIME allowlist.
		$claimed_mime = isset( $file['mimeType'] ) ? (string) $file['mimeType'] : '';
		if ( ! in_array( $claimed_mime, self::ALLOWED_MIMES, true ) ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'unsupported_type',
			);
		}

		// 4. Base64 decode.
		// Strip data URL prefix if present (e.g., 'data:image/jpeg;base64,...').
		// The frontend sends raw base64, but some browser paths prepend this prefix.
		$raw_base64 = (string) preg_replace( '/^data:[^;]+;base64,/i', '', $base64 );

		if ( '' === $raw_base64 ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'invalid_encoding',
			);
		}

		$decoded = base64_decode( $raw_base64, true ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		if ( false === $decoded ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'invalid_encoding',
			);
		}

		// 5. Magic-byte check.
		$finfo       = new \finfo( FILEINFO_MIME_TYPE );
		$actual_mime = $finfo->buffer( $decoded );
		if ( $actual_mime !== $claimed_mime ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'content_mismatch',
			);
		}

		// 6. Dimension sanity.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$img_info = @getimagesizefromstring( $decoded );
		if ( false === $img_info ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'not_an_image',
			);
		}
		if ( $img_info[0] > $this->max_dimension || $img_info[1] > $this->max_dimension ) {
			return array(
				'fileIndex' => $index,
				'code'      => 'dimensions_too_large',
			);
		}

		return null;
	}
}
