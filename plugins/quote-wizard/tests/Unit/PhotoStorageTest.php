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

// ---------------------------------------------------------------------------
// Admin-includes ordering (Step 5.14.1 — wp_tempnam loading bug)
// ---------------------------------------------------------------------------

/**
 * Test double that records call order onto a public log property instead of
 * no-op'ing ensure_upload_functions_loaded(), so ordering relative to
 * wp_tempnam() can be asserted.
 */
function make_order_tracking_photo_storage(): PhotoStorage {
	return new class() extends PhotoStorage {
		/** @var array<int,string> */
		public array $log = [];

		protected function ensure_upload_functions_loaded(): void {
			$this->log[] = 'admin_includes_loaded';
		}
	};
}

it(
	'loads admin includes before write_temp_file calls wp_tempnam',
	function (): void {
		$storage = make_order_tracking_photo_storage();

		Functions\when( 'wp_tempnam' )->alias(
			function () use ( $storage ): string {
				$storage->log[]                                = 'wp_tempnam_called';
				$path                                          = sys_get_temp_dir() . '/goqw-test-' . uniqid( '', true );
				$GLOBALS['__photo_storage_test_tmp_files'][] = $path;
				return $path;
			}
		);
		Functions\when( 'wp_handle_upload' )->justReturn(
			[ 'file' => '/tmp/x.jpg', 'url' => 'https://example.test/x.jpg', 'type' => 'image/jpeg' ]
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 1 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/x.jpg' );

		$storage->store_photo( base64_encode( 'bytes' ), 'image/jpeg', 'x.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( $storage->log )->toBe( [ 'admin_includes_loaded', 'wp_tempnam_called' ] );
	}
);

it(
	'loads admin includes even when the base64 payload is invalid (fails before wp_tempnam is reached)',
	function (): void {
		$storage = make_order_tracking_photo_storage();

		$result = $storage->store_photo( '', 'image/jpeg', 'test.jpg' );

		expect( $result['success'] )->toBeFalse();
		expect( $storage->log )->toBe( [ 'admin_includes_loaded' ] );
	}
);

it(
	'loads admin includes exactly once per store_photo call, before any wp-admin-only function runs',
	function (): void {
		$storage = make_order_tracking_photo_storage();
		stub_wp_tempnam();
		Functions\when( 'wp_handle_upload' )->alias(
			function () use ( $storage ): array {
				$storage->log[] = 'wp_handle_upload_called';
				return [ 'file' => '/tmp/x.jpg', 'url' => 'https://example.test/x.jpg', 'type' => 'image/jpeg' ];
			}
		);
		Functions\when( 'wp_insert_attachment' )->justReturn( 1 );
		Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/x.jpg' );

		$storage->store_photo( base64_encode( 'bytes' ), 'image/jpeg', 'x.jpg' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

		expect( array_count_values( $storage->log )['admin_includes_loaded'] ?? 0 )->toBe( 1 );
		expect( array_search( 'admin_includes_loaded', $storage->log, true ) )
			->toBeLessThan( array_search( 'wp_handle_upload_called', $storage->log, true ) );
	}
);

// ---------------------------------------------------------------------------
// Namespace prefix defense (Step 5.14.1)
// ---------------------------------------------------------------------------

it(
	'every WordPress function call in PhotoStorage.php is backslash-prefixed',
	function (): void {
		$source = (string) file_get_contents( __DIR__ . '/../../src/Submissions/PhotoStorage.php' );

		$unprefixable = [ 'add_filter', 'remove_filter', 'sanitize_file_name', 'is_wp_error', 'update_post_meta' ];
		foreach ( $unprefixable as $fn ) {
			$bare_count = preg_match_all( '/(?<![\\\\:>])\b' . preg_quote( $fn, '/' ) . '\s*\(/', $source );
			expect( $bare_count )->toBe( 0, "Found unprefixed call to {$fn}() in PhotoStorage.php" );
		}
	}
);

it(
	'PhotoStorage.php prefixes every admin-include-dependent WordPress function it calls',
	function (): void {
		$source = (string) file_get_contents( __DIR__ . '/../../src/Submissions/PhotoStorage.php' );

		assert_wp_calls_are_prefixed(
			$source,
			[
				'wp_tempnam',
				'wp_handle_upload',
				'wp_insert_attachment',
				'wp_generate_attachment_metadata',
				'wp_update_attachment_metadata',
				'wp_get_attachment_url',
				'wp_delete_attachment',
			]
		);
	}
);

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

// ---------------------------------------------------------------------------
// Filename extension/MIME correction (Step 5.14.2)
// ---------------------------------------------------------------------------

/**
 * Runs store_photo() and returns the 'name' key the (mocked) wp_handle_upload()
 * was actually called with — the observable result of correct_filename_extension(),
 * a private method, without widening its visibility for tests.
 */
function store_photo_and_capture_upload_name( string $original_name, string $mime_type ): string {
	stub_wp_tempnam();
	$captured_name = null;
	Functions\when( 'wp_handle_upload' )->alias(
		static function ( array $file ) use ( &$captured_name ): array {
			$captured_name = $file['name'];
			return [ 'file' => '/tmp/x', 'url' => 'https://example.test/x', 'type' => $file['type'] ];
		}
	);
	Functions\when( 'wp_insert_attachment' )->justReturn( 1 );
	Functions\when( 'wp_get_attachment_url' )->justReturn( 'https://example.test/x' );

	$storage = make_photo_storage();
	$storage->store_photo( base64_encode( 'bytes' ), $mime_type, $original_name ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode

	return (string) $captured_name;
}

it(
	'corrects a mismatched extension for each known MIME type',
	function (): void {
		expect( store_photo_and_capture_upload_name( 'photo.png', 'image/jpeg' ) )->toBe( 'photo.jpg' );
		expect( store_photo_and_capture_upload_name( 'photo.gif', 'image/png' ) )->toBe( 'photo.png' );
		expect( store_photo_and_capture_upload_name( 'photo.jpg', 'image/webp' ) )->toBe( 'photo.webp' );
		expect( store_photo_and_capture_upload_name( 'photo.png', 'image/gif' ) )->toBe( 'photo.gif' );
		expect( store_photo_and_capture_upload_name( 'photo', 'image/jpeg' ) )->toBe( 'photo.jpg' );
	}
);

it(
	'leaves an already-correct filename unchanged',
	function (): void {
		expect( store_photo_and_capture_upload_name( 'photo.jpg', 'image/jpeg' ) )->toBe( 'photo.jpg' );
		expect( store_photo_and_capture_upload_name( 'photo.PNG', 'image/png' ) )->toBe( 'photo.PNG' );
	}
);

it(
	'passes the filename through unchanged for an unrecognized MIME type',
	function (): void {
		expect( store_photo_and_capture_upload_name( 'photo.bmp', 'image/bmp' ) )->toBe( 'photo.bmp' );
	}
);
