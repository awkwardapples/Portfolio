<?php
/**
 * Regression test for the Step 5.14.2 photo-upload extension/MIME bug.
 *
 * See AUDIT-5.14.2-integration.md: this project has no WP_UnitTestCase / real
 * WordPress bootstrap, so wp_handle_sideload() (and the wp_check_filetype_and_ext()
 * check inside it that rejected the original bug's mismatched files) cannot be
 * exercised for real. This test reproduces the exact reported scenario — a PNG
 * selected by the user, compressed client-side to JPEG bytes, submitted with a
 * mismatched-then-corrected filename — end-to-end through PhotoStorage::store_photo(),
 * asserting the upload succeeds and the (mocked) wp_handle_sideload() only ever sees a
 * filename whose extension matches the claimed MIME type.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Submissions\PhotoStorage;
use Brain\Monkey;
use Brain\Monkey\Functions;

beforeEach(
	function (): void {
		Monkey\setUp();
		Functions\when( 'sanitize_file_name' )->returnArg();
		Functions\when( 'add_filter' )->justReturn( true );
		Functions\when( 'remove_filter' )->justReturn( true );
		Functions\when( 'update_post_meta' )->justReturn( true );
		Functions\when( 'wp_generate_attachment_metadata' )->justReturn( [] );
		Functions\when( 'wp_update_attachment_metadata' )->justReturn( true );
		Functions\when( 'wp_tempnam' )->justReturn( sys_get_temp_dir() . '/goqw-test-' . uniqid( '', true ) );
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

function upload_storage(): PhotoStorage {
	return new class() extends PhotoStorage {
		protected function ensure_upload_functions_loaded(): void {}
	};
}

it(
	'photo upload succeeds when the filename extension already matches the MIME type',
	function (): void {
		$received_name = null;
		Functions\when( 'wp_handle_sideload' )->alias(
			static function ( array $file ) use ( &$received_name ): array {
				$received_name = $file['name'];
				return [ 'file' => '/tmp/test.jpg', 'url' => 'https://example.test/test.jpg', 'type' => 'image/jpeg' ];
			}
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 10 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/test.jpg' );

		$storage = upload_storage();
		$result  = $storage->store_photo( base64_encode( 'jpeg bytes' ), 'image/jpeg', 'holiday.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeTrue();
		expect( $received_name )->toBe( 'holiday.jpg' );
	}
);

it(
	'photo upload succeeds and the mismatched extension is corrected before wp_handle_sideload runs (the reported bug)',
	function (): void {
		$received_name = null;
		Functions\when( 'wp_handle_sideload' )->alias(
			static function ( array $file ) use ( &$received_name ): array {
				$received_name = $file['name'];
				// A real wp_handle_sideload() would reject this call outright if
				// $file['name']'s extension didn't match $file['type'] — asserting
				// what it received is the regression guard for that rejection.
				return [ 'file' => '/tmp/holiday.jpg', 'url' => 'https://example.test/holiday.jpg', 'type' => 'image/jpeg' ];
			}
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 11 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/holiday.jpg' );

		$storage = upload_storage();
		// Reproduces the original bug report exactly: user selected holiday.png,
		// browser-side compression re-encoded it to JPEG bytes (image-compression.ts
		// always outputs image/jpeg), but a pre-5.14.2 client still sent the
		// pre-compression filename.
		$result = $storage->store_photo( base64_encode( 'jpeg bytes from a compressed png source' ), 'image/jpeg', 'holiday.png' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeTrue();
		expect( $received_name )->toBe( 'holiday.jpg' );
	}
);
