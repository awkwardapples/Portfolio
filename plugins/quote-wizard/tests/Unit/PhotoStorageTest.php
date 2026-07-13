<?php
/**
 * Unit tests for PhotoStorage (Step 5.13e).
 *
 * ensure_upload_functions_loaded() is overridden with a no-op in a test
 * subclass because the real method requires wp-admin/includes files that
 * don't exist under the test ABSPATH stub — the same reason
 * SubmissionRepository/Forwarder test doubles override methods that touch
 * real infrastructure rather than calling parent::.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Submissions\PhotoStorage;
use Brain\Monkey;
use Brain\Monkey\Functions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Test double: no-ops the wp-admin/includes require so tests run without WP.
 */
function make_photo_storage(): PhotoStorage {
	return new class() extends PhotoStorage {
		protected function ensure_upload_functions_loaded(): void {}
	};
}

/** @var list<string> Temp files created during a test, removed in afterEach. */
$GLOBALS['__photo_storage_test_tmp_files'] = [];

/**
 * Registers a fake wp_tempnam() that returns a real, writable path in the
 * system temp dir so file_put_contents() in PhotoStorage actually succeeds.
 */
function stub_wp_tempnam(): void {
	Functions\when( 'wp_tempnam' )->alias(
		static function (): string {
			$path                                          = sys_get_temp_dir() . '/goqw-test-' . uniqid( '', true );
			$GLOBALS['__photo_storage_test_tmp_files'][] = $path;
			return $path;
		}
	);
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(
	function (): void {
		Monkey\setUp();
		Functions\when( 'sanitize_file_name' )->returnArg();
		Functions\when( 'add_filter' )->justReturn( true );
		Functions\when( 'remove_filter' )->justReturn( true );
		Functions\when( 'update_post_meta' )->justReturn( true );
		Functions\when( 'wp_generate_attachment_metadata' )->justReturn( [ 'width' => 4, 'height' => 4 ] );
		Functions\when( 'wp_update_attachment_metadata' )->justReturn( true );
		stub_wp_tempnam();
		$GLOBALS['__photo_storage_test_tmp_files'] = [];
	}
);

afterEach(
	function (): void {
		foreach ( $GLOBALS['__photo_storage_test_tmp_files'] as $path ) {
			if ( file_exists( $path ) ) {
				unlink( $path );
			}
		}
		Monkey\tearDown();
	}
);

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

it(
	'stores a valid photo and returns url + attachmentId',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn(
			[
				'file' => '/var/www/uploads/goqw/2026/07/test.jpg',
				'url'  => 'https://example.test/wp-content/uploads/goqw/2026/07/test.jpg',
				'type' => 'image/jpeg',
			]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 123 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/wp-content/uploads/goqw/2026/07/test.jpg' );

		$storage = make_photo_storage();
		$result  = $storage->store_photo( base64_encode( 'fake jpeg bytes' ), 'image/jpeg', 'test.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeTrue();
		expect( $result['url'] )->toBe( 'https://example.test/wp-content/uploads/goqw/2026/07/test.jpg' );
		expect( $result['attachmentId'] )->toBe( 123 );
	}
);

it(
	'strips a data URL prefix before decoding',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn(
			[
				'file' => '/var/www/uploads/goqw/2026/07/test.png',
				'url'  => 'https://example.test/wp-content/uploads/goqw/2026/07/test.png',
				'type' => 'image/png',
			]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 456 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/wp-content/uploads/goqw/2026/07/test.png' );

		$storage = make_photo_storage();
		$data_url = 'data:image/png;base64,' . base64_encode( 'fake png bytes' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$result   = $storage->store_photo( $data_url, 'image/png', 'test.png' );

		expect( $result['success'] )->toBeTrue();
		expect( $result['attachmentId'] )->toBe( 456 );
	}
);

it(
	'tags the created attachment with the retention meta key',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn(
			[ 'file' => '/tmp/x.jpg', 'url' => 'https://example.test/x.jpg', 'type' => 'image/jpeg' ]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 789 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/x.jpg' );

		$captured = null;
		Functions\when( 'update_post_meta' )->alias(
			static function ( int $id, string $key, mixed $value ) use ( &$captured ): bool {
				$captured = [ $id, $key, $value ];
				return true;
			}
		);

		$storage = make_photo_storage();
		$storage->store_photo( base64_encode( 'bytes' ), 'image/jpeg', 'x.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $captured )->toBe( [ 789, '_goqw_photo', 1 ] );
	}
);

it(
	'handles a large (~10MB) photo without failure',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn(
			[ 'file' => '/tmp/big.jpg', 'url' => 'https://example.test/big.jpg', 'type' => 'image/jpeg' ]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 1 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/big.jpg' );

		$large_bytes = str_repeat( 'A', 10 * 1024 * 1024 );
		$storage     = make_photo_storage();
		$result      = $storage->store_photo( base64_encode( $large_bytes ), 'image/jpeg', 'big.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeTrue();
	}
);

// ---------------------------------------------------------------------------
// Failure paths
// ---------------------------------------------------------------------------

it(
	'returns invalid_encoding for an empty dataBase64 string',
	function (): void {
		$storage = make_photo_storage();
		$result  = $storage->store_photo( '', 'image/jpeg', 'test.jpg' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['error'] )->toBe( 'invalid_encoding' );
	}
);

it(
	'returns invalid_encoding for malformed base64',
	function (): void {
		$storage = make_photo_storage();
		$result  = $storage->store_photo( '!!!not-valid-base64!!!', 'image/jpeg', 'test.jpg' );

		expect( $result['success'] )->toBeFalse();
		expect( $result['error'] )->toBe( 'invalid_encoding' );
	}
);

it(
	'returns the wp_handle_upload error string when the upload fails',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn( [ 'error' => 'Unable to create directory.' ] );

		$storage = make_photo_storage();
		$result  = $storage->store_photo( base64_encode( 'bytes' ), 'image/jpeg', 'test.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeFalse();
		expect( $result['error'] )->toBe( 'Unable to create directory.' );
	}
);

it(
	'returns attachment_insert_failed when wp_insert_attachment returns a WP_Error',
	function (): void {
		Functions\when( 'wp_handle_upload' )->justReturn(
			[ 'file' => '/tmp/x.jpg', 'url' => 'https://example.test/x.jpg', 'type' => 'image/jpeg' ]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( new WP_Error( 'db_insert_error' ) );

		$storage = make_photo_storage();
		$result  = $storage->store_photo( base64_encode( 'bytes' ), 'image/jpeg', 'x.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $result['success'] )->toBeFalse();
		expect( $result['error'] )->toBe( 'attachment_insert_failed' );
	}
);

// ---------------------------------------------------------------------------
// Deletion (D6 orphan cleanup, D3 retention)
// ---------------------------------------------------------------------------

it(
	'delete_photo returns true when wp_delete_attachment succeeds',
	function (): void {
		Functions\when( 'wp_delete_attachment' )->justReturn( new stdClass() );

		$storage = make_photo_storage();
		expect( $storage->delete_photo( 42 ) )->toBeTrue();
	}
);

it(
	'delete_photo returns false when wp_delete_attachment fails',
	function (): void {
		Functions\when( 'wp_delete_attachment' )->justReturn( false );

		$storage = make_photo_storage();
		expect( $storage->delete_photo( 42 ) )->toBeFalse();
	}
);

// ---------------------------------------------------------------------------
// Upload directory routing (D1)
// ---------------------------------------------------------------------------

it(
	'filter_upload_dir routes uploads into the goqw subdirectory ahead of year/month',
	function (): void {
		$storage = make_photo_storage();
		$result  = $storage->filter_upload_dir(
			[
				'path'    => '/var/www/wp-content/uploads/2026/07',
				'url'     => 'https://example.test/wp-content/uploads/2026/07',
				'subdir'  => '/2026/07',
				'basedir' => '/var/www/wp-content/uploads',
				'baseurl' => 'https://example.test/wp-content/uploads',
				'error'   => false,
			]
		);

		expect( $result['basedir'] )->toBe( '/var/www/wp-content/uploads/goqw' );
		expect( $result['baseurl'] )->toBe( 'https://example.test/wp-content/uploads/goqw' );
		expect( $result['path'] )->toBe( '/var/www/wp-content/uploads/goqw/2026/07' );
		expect( $result['url'] )->toBe( 'https://example.test/wp-content/uploads/goqw/2026/07' );
	}
);
