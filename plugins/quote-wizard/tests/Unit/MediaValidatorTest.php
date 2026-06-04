<?php
/**
 * Unit tests for MediaValidator.
 *
 * Tests the validation order and all failure codes documented in ADR-0015
 * amendment (Step 4.8). Actual image bytes are generated via PHP's GD
 * extension so finfo and getimagesizefromstring calls run against real data.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Submissions\MediaValidator;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a minimal valid JPEG as raw bytes using GD, then base64-encode it.
 * Skips the test if GD is unavailable.
 *
 * @return string  Base64-encoded JPEG bytes.
 */
function make_jpeg_base64( int $width = 4, int $height = 4 ): string {
	if ( ! function_exists( 'imagecreatetruecolor' ) ) {
		test()->markTestSkipped( 'GD extension not available; cannot generate test JPEG.' );
	}
	$img = imagecreatetruecolor( $width, $height );
	imagecolorallocate( $img, 255, 255, 255 );
	ob_start();
	imagejpeg( $img, null, 80 ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
	$data = (string) ob_get_clean();
	imagedestroy( $img );
	return base64_encode( $data ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
}

/**
 * Build a valid single-photo answers array.
 *
 * @param array<string,mixed> $file_overrides  Overrides for the file entry.
 * @return array<string,mixed>
 */
function photo_answers( array $file_overrides = array() ): array {
	return array(
		'photos' => array(
			'files' => array(
				array_merge(
					array(
						'fileId'       => 'file-001',
						'originalName' => 'test.jpg',
						'mimeType'     => 'image/jpeg',
						'sizeBytes'    => 1024,
						'width'        => 4,
						'height'       => 4,
						'dataBase64'   => make_jpeg_base64(),
					),
					$file_overrides
				),
			),
		),
	);
}

// ---------------------------------------------------------------------------
// Size checks
// ---------------------------------------------------------------------------

it( 'accepts a valid photo that passes all checks', function (): void {
	$result = ( new MediaValidator() )->validate( photo_answers() );
	expect( $result['ok'] )->toBeTrue();
	expect( $result['issues'] )->toBeEmpty();
} );

it( 'rejects a photo whose encoded size exceeds the per-photo limit', function (): void {
	// Use a small per-photo limit so the test does not allocate 5 MB of data.
	$data    = str_repeat( 'A', 101 );
	$answers = array(
		'photos' => array(
			'files' => array(
				array(
					'fileId'       => 'f1',
					'originalName' => 'big.jpg',
					'mimeType'     => 'image/jpeg',
					'dataBase64'   => $data,
				),
			),
		),
	);
	$result  = ( new MediaValidator( max_photo_bytes: 100 ) )->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	expect( $result['issues'][0]['code'] )->toBe( 'too_large' );
	expect( $result['issues'][0]['fileIndex'] )->toBe( 0 );
} );

it( 'rejects when total encoded size exceeds the total limit', function (): void {
	// Use small limits so real JPEG data is sufficient.
	// Each valid JPEG is ~300 bytes of base64; limit to 200 per-photo and 400 total
	// so the third file triggers total_too_large.
	$jpeg   = make_jpeg_base64();
	$files  = array(
		array( 'fileId' => 'f1', 'originalName' => 'a.jpg', 'mimeType' => 'image/jpeg', 'dataBase64' => $jpeg ),
		array( 'fileId' => 'f2', 'originalName' => 'b.jpg', 'mimeType' => 'image/jpeg', 'dataBase64' => $jpeg ),
		array( 'fileId' => 'f3', 'originalName' => 'c.jpg', 'mimeType' => 'image/jpeg', 'dataBase64' => $jpeg ),
	);
	$answers = array( 'photos' => array( 'files' => $files ) );

	$jpeg_len = strlen( $jpeg );
	$validator = new MediaValidator(
		max_photo_bytes: $jpeg_len,         // each file is exactly at the limit (passes step 1)
		max_total_bytes: $jpeg_len * 2,     // two files fit, third tips over
		max_dimension: 12000,
	);

	$result = $validator->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	expect( $result['issues'][0]['code'] )->toBe( 'total_too_large' );
	expect( $result['issues'][0]['fileIndex'] )->toBe( 2 );
} );

// ---------------------------------------------------------------------------
// MIME and encoding checks
// ---------------------------------------------------------------------------

it( 'rejects a file with an unsupported MIME type', function (): void {
	$answers = array(
		'photos' => array(
			'files' => array(
				array(
					'fileId'       => 'f1',
					'originalName' => 'doc.pdf',
					'mimeType'     => 'application/pdf',
					'dataBase64'   => base64_encode( 'some data' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				),
			),
		),
	);
	$result  = ( new MediaValidator() )->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	expect( $result['issues'][0]['code'] )->toBe( 'unsupported_type' );
} );

it( 'rejects a file with an empty dataBase64 string', function (): void {
	$answers = array(
		'photos' => array(
			'files' => array(
				array(
					'fileId'       => 'f1',
					'originalName' => 'empty.jpg',
					'mimeType'     => 'image/jpeg',
					'dataBase64'   => '',
				),
			),
		),
	);
	$result  = ( new MediaValidator() )->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	expect( $result['issues'][0]['code'] )->toBe( 'invalid_encoding' );
} );

it( 'rejects a file whose base64 contains non-base64 characters', function (): void {
	$answers = array(
		'photos' => array(
			'files' => array(
				array(
					'fileId'       => 'f1',
					'originalName' => 'bad.jpg',
					'mimeType'     => 'image/jpeg',
					'dataBase64'   => '!!!not-valid-base64!!!',
				),
			),
		),
	);
	$result  = ( new MediaValidator() )->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	expect( $result['issues'][0]['code'] )->toBe( 'invalid_encoding' );
} );

// ---------------------------------------------------------------------------
// Magic-byte check
// ---------------------------------------------------------------------------

it( 'rejects a file whose claimed MIME does not match actual content (SVG renamed as JPEG)', function (): void {
	// Claim image/jpeg but provide SVG content whose finfo reports text/html or image/svg+xml.
	$svg_data  = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
	$answers   = array(
		'photos' => array(
			'files' => array(
				array(
					'fileId'       => 'f1',
					'originalName' => 'evil.jpg',
					'mimeType'     => 'image/jpeg',
					'dataBase64'   => base64_encode( $svg_data ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
				),
			),
		),
	);
	$result    = ( new MediaValidator() )->validate( $answers );
	expect( $result['ok'] )->toBeFalse();
	// Either content_mismatch or not_an_image depending on finfo resolution.
	expect( in_array( $result['issues'][0]['code'], array( 'content_mismatch', 'not_an_image' ), true ) )->toBeTrue();
} );

// ---------------------------------------------------------------------------
// Non-media answers are skipped
// ---------------------------------------------------------------------------

it( 'ignores non-photo answer fields (plain string, number, array)', function (): void {
	$answers = array(
		'fence_type' => 'wooden',
		'length_m'   => 10,
		'options'    => array( 'gate', 'post_caps' ),
	);
	$result  = ( new MediaValidator() )->validate( $answers );
	expect( $result['ok'] )->toBeTrue();
} );
