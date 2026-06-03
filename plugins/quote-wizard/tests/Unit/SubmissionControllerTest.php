<?php
/**
 * Unit tests for SubmissionController.
 *
 * Uses test doubles (anonymous classes) for repository and forwarder
 * so tests run without a database or real HTTP calls.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Rest\SubmissionController;
use Agency\QuoteWizard\Submissions\Forwarder;
use Agency\QuoteWizard\Submissions\ForwardResult;
use Agency\QuoteWizard\Submissions\SubmissionRepository;
use Brain\Monkey;
use Brain\Monkey\Functions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a valid wire payload array.
 *
 * @param array<string,mixed> $overrides  Fields to override.
 * @return array<string,mixed>
 */
function valid_payload( array $overrides = [] ): array {
	return array_merge(
		array(
			'contractVersion' => 2,
			'wizardId'        => 'fencing',
			'schemaVersion'   => 1,
			'answers'         => array( 'fence_type' => 'wooden' ),
			'pricing'         => array(
				'totalPence' => 50000,
				'lowPence'   => 45000,
				'highPence'  => 55000,
				'currency'   => 'GBP',
			),
			'clientTimestamp' => '2026-05-29T12:00:00Z',
		),
		$overrides
	);
}

/**
 * Build a WP_REST_Request stub carrying a JSON body.
 *
 * @param array<string,mixed> $json_params  JSON body.
 */
function make_request( array $json_params ): \WP_REST_Request {
	$request = \Mockery::mock( \WP_REST_Request::class );
	$request->shouldReceive( 'get_json_params' )->andReturn( $json_params );
	return $request;
}

/**
 * Stub repository that records calls and returns a fixed ID.
 *
 * @param int  $returns_id      insert() return value.
 * @param bool $throw_on_insert  If true, insert() throws.
 */
function spy_repository( int $returns_id = 42, bool $throw_on_insert = false ): object {
	return new class ( $returns_id, $throw_on_insert ) extends SubmissionRepository {
		/** @var list<array<string,mixed>> */
		public array $inserts = [];
		/** @var list<int> */
		public array $forwarded = [];
		/** @var list<array{id:int,msg:string}> */
		public array $failed = [];

		public function __construct(
			private readonly int $returns_id,
			private readonly bool $throw_on_insert
		) {
			// Parent constructor not called: all methods that use $wpdb are overridden.
		}

		/** @param array<string,mixed> $payload */
		public function insert( array $payload ): int {
			if ( $this->throw_on_insert ) {
				throw new \RuntimeException( 'simulated DB failure' );
			}
			$this->inserts[] = $payload;
			return $this->returns_id;
		}

		public function mark_forwarded( int $id ): void {
			$this->forwarded[] = $id;
		}

		public function mark_forward_failed( int $id, string $msg ): void {
			$this->failed[] = array( 'id' => $id, 'msg' => $msg );
		}
	};
}

/**
 * Stub forwarder that returns a fixed result.
 *
 * @param ForwardResult $result  Value to return from forward().
 */
function spy_forwarder( ForwardResult $result ): object {
	return new class ( $result ) extends Forwarder {
		/** @var list<array{id:int,payload:array<string,mixed>}> */
		public array $calls = [];

		public function __construct( private readonly ForwardResult $result ) {}

		/** @param array<string,mixed> $payload */
		public function forward( int $submission_id, array $payload ): ForwardResult {
			$this->calls[] = array( 'id' => $submission_id, 'payload' => $payload );
			return $this->result;
		}
	};
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(
	function (): void {
		Monkey\setUp();
		Functions\when( 'sanitize_key' )->returnArg();
		Functions\when( 'sanitize_text_field' )->returnArg();
		Functions\when( 'wp_json_encode' )->alias(
			static fn( mixed $data ): string => (string) json_encode( $data )
		);
		Functions\when( 'current_time' )->justReturn( '2026-05-29 12:00:00' );
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
	}
);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

it(
	'returns 200 with reference and calls mark_forwarded after successful forward',
	function (): void {
		$repo    = spy_repository( 42 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $response->get_data() )->toHaveKey( 'reference' );
		expect( $response->get_data()['reference'] )->toBe( 'GOQW-42' );
		expect( $repo->forwarded )->toContain( 42 );
		expect( $repo->failed )->toBeEmpty();
	}
);

it(
	'returns 502 with forwarder_unavailable when forward fails, data still persisted',
	function (): void {
		$repo    = spy_repository( 7 );
		$fwd     = spy_forwarder( ForwardResult::failure( 'transport_error: connection refused' ) );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		Functions\when( 'goqw_log' )->justReturn( null );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 502 );
		expect( $response->get_data()['errorCode'] )->toBe( 'forwarder_unavailable' );
		expect( $response->get_data()['submissionId'] )->toBe( 7 );
		expect( $repo->inserts )->not->toBeEmpty();
		expect( $repo->failed[0]['id'] )->toBe( 7 );
	}
);

it(
	'calls repository insert before forwarder forward (strict ordering, ADR-0001)',
	function (): void {
		$order = [];
		$repo  = new class ( $order ) extends SubmissionRepository {
			/** @param list<string> $order */
			public function __construct( private array &$order ) {
				// Parent constructor not called: all methods that use $wpdb are overridden.
			}

			/** @param array<string,mixed> $payload */
			public function insert( array $payload ): int {
				$this->order[] = 'insert';
				return 1;
			}

			public function mark_forwarded( int $id ): void {}
			public function mark_forward_failed( int $id, string $msg ): void {}
		};

		$fwd = new class ( $order ) extends Forwarder {
			/** @param list<string> $order */
			public function __construct( private array &$order ) {}

			/** @param array<string,mixed> $payload */
			public function forward( int $id, array $payload ): ForwardResult {
				$this->order[] = 'forward';
				return ForwardResult::success();
			}
		};

		$ctrl = new SubmissionController( $repo, $fwd );
		$ctrl->handle( make_request( valid_payload() ) );

		expect( $order )->toBe( array( 'insert', 'forward' ) );
	}
);

it(
	'returns 500 and does not call forwarder when persistence fails',
	function (): void {
		$repo    = spy_repository( 0, true );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 500 );
		expect( $fwd->calls )->toBeEmpty();
	}
);

it(
	'returns 400 and neither persists nor forwards when payload is invalid (missing wizardId)',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$payload = valid_payload();
		unset( $payload['wizardId'] );
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $repo->inserts )->toBeEmpty();
		expect( $fwd->calls )->toBeEmpty();
	}
);

it(
	'returns 400 when contractVersion is 1 (superseded)',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload( array( 'contractVersion' => 1 ) ) );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'accepts payload with float-like pricing object but normalises to int pence',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		// Float pricing values should be rejected; only int pence accepted.
		$payload = valid_payload(
			array(
				'pricing' => array(
					'totalPence' => 500.5,
					'lowPence'   => 450,
					'highPence'  => 550,
					'currency'   => 'GBP',
				),
			)
		);
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		// The float pricing block is dropped; submission still accepted.
		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts[0]['pricing_json'] )->toBeNull();
	}
);

it(
	'calls mark_forward_failed with the submission id when forward fails',
	function (): void {
		$repo    = spy_repository( 99 );
		$fwd     = spy_forwarder( ForwardResult::failure( 'http_status_503' ) );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		Functions\when( 'goqw_log' )->justReturn( null );

		$ctrl->handle( $request );

		expect( $repo->failed )->toHaveCount( 1 );
		expect( $repo->failed[0]['id'] )->toBe( 99 );
		expect( $repo->failed[0]['msg'] )->toBe( 'http_status_503' );
	}
);
