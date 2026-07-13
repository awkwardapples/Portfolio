<?php
/**
 * Unit tests for PhotoRetention (Step 5.13e, D3).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Cron\PhotoRetention;
use Agency\QuoteWizard\Submissions\PhotoStorage;
use Brain\Monkey;
use Brain\Monkey\Functions;

/**
 * Stub photo storage that records delete_photo() calls without touching WP.
 */
function spy_retention_photo_storage(): object {
	return new class() extends PhotoStorage {
		/** @var list<int> */
		public array $deleted = [];

		public function __construct() {}

		public function delete_photo( int $attachment_id ): bool {
			$this->deleted[] = $attachment_id;
			return true;
		}
	};
}

beforeEach(
	function (): void {
		Monkey\setUp();
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

it(
	'deletes every attachment ID returned by the query',
	function (): void {
		Functions\when( 'get_posts' )->justReturn( [ 1, 2, 3 ] );

		$storage   = spy_retention_photo_storage();
		$retention = new PhotoRetention( $storage );
		$retention->execute();

		expect( $storage->deleted )->toBe( [ 1, 2, 3 ] );
	}
);

it(
	'deletes nothing when the query returns no attachments',
	function (): void {
		Functions\when( 'get_posts' )->justReturn( [] );

		$storage   = spy_retention_photo_storage();
		$retention = new PhotoRetention( $storage );
		$retention->execute();

		expect( $storage->deleted )->toBeEmpty();
	}
);

it(
	'casts get_posts results to int',
	function (): void {
		Functions\when( 'get_posts' )->justReturn( [ '5', '6' ] );

		$storage   = spy_retention_photo_storage();
		$retention = new PhotoRetention( $storage );
		$retention->execute();

		expect( $storage->deleted )->toBe( [ 5, 6 ] );
	}
);

it(
	'queries attachments tagged with the PhotoStorage meta key',
	function (): void {
		$captured_args = null;
		Functions\when( 'get_posts' )->alias(
			static function ( array $args ) use ( &$captured_args ): array {
				$captured_args = $args;
				return [];
			}
		);

		( new PhotoRetention( spy_retention_photo_storage() ) )->execute();

		expect( $captured_args['post_type'] )->toBe( 'attachment' );
		expect( $captured_args['meta_key'] )->toBe( PhotoStorage::PHOTO_META_KEY );
		expect( $captured_args['fields'] )->toBe( 'ids' );
	}
);

it(
	'queries a date_query cutoff approximately 6 months before now',
	function (): void {
		$captured_args = null;
		Functions\when( 'get_posts' )->alias(
			static function ( array $args ) use ( &$captured_args ): array {
				$captured_args = $args;
				return [];
			}
		);

		( new PhotoRetention( spy_retention_photo_storage() ) )->execute();

		$expected_cutoff = gmdate( 'Y-m-d H:i:s', strtotime( '-6 months' ) );

		expect( $captured_args['date_query'][0]['column'] )->toBe( 'post_date_gmt' );
		expect( $captured_args['date_query'][0]['before'] )->toBe( $expected_cutoff );
	}
);

it(
	'static run() executes without error using the default PhotoStorage',
	function (): void {
		Functions\when( 'get_posts' )->justReturn( [] );

		expect( fn () => PhotoRetention::run() )->not->toThrow( \Throwable::class );
	}
);
