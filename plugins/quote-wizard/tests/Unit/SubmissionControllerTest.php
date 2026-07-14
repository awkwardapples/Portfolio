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

use Agency\QuoteWizard\Rest\BotProtection;
use Agency\QuoteWizard\Rest\SubmissionController;
use Agency\QuoteWizard\Submissions\ConsentValidator;
use Agency\QuoteWizard\Submissions\DuplicateDetector;
use Agency\QuoteWizard\Submissions\Forwarder;
use Agency\QuoteWizard\Submissions\ForwardResult;
use Agency\QuoteWizard\Submissions\PhotoStorage;
use Agency\QuoteWizard\Submissions\SubmissionRepository;
use Brain\Monkey;
use Brain\Monkey\Functions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a valid wire payload array.
 *
 * `answers` is merged (not replaced) with the default when `$overrides`
 * supplies its own `answers` array, so every test keeps a valid
 * data_processing_consent answer (Step 5.14) without having to repeat it —
 * unless a test deliberately overrides that key to exercise the consent
 * check itself.
 *
 * @param array<string,mixed> $overrides  Fields to override.
 * @return array<string,mixed>
 */
function valid_payload( array $overrides = [] ): array {
	$defaults = array(
		'contractVersion' => 3,
		'wizardId'        => 'fencing',
		'schemaVersion'   => 1,
		'quoteMode'       => 'instant',
		'answers'         => array(
			'fence_type'              => 'wooden',
			'data_processing_consent' => array( 'agreed' ),
		),
		'pricing'         => array(
			'totalPence' => 50000,
			'lowPence'   => 45000,
			'highPence'  => 55000,
			'currency'   => 'GBP',
		),
		'clientTimestamp' => '2026-05-29T12:00:00Z',
	);

	if ( isset( $overrides['answers'] ) && is_array( $overrides['answers'] ) ) {
		$overrides['answers'] = array_merge( $defaults['answers'], $overrides['answers'] );
	}

	return array_merge( $defaults, $overrides );
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

/**
 * Stub validator that always passes, so photo-storage-focused tests don't
 * need real image bytes to satisfy MediaValidator's magic-byte checks.
 */
function stub_media_validator_ok(): object {
	return new class extends \Agency\QuoteWizard\Submissions\MediaValidator {
		/** @return array{ok: bool, issues: list<array{fileIndex: int, code: string}>} */
		public function validate( array $answers ): array {
			return array( 'ok' => true, 'issues' => array() );
		}
	};
}

/**
 * Stub photo storage (Step 5.13e) that returns a fixed store_photo() result
 * for every call and records calls to both methods, so tests can assert on
 * SubmissionController's orchestration without touching real WP media functions
 * (that's PhotoStorageTest's job).
 *
 * @param array{success: bool, url?: string, attachmentId?: int, error?: string} $result  Value store_photo() returns.
 */
function spy_photo_storage( array $result ): object {
	return new class ( $result ) extends PhotoStorage {
		/** @var list<array{base64: string, mime: string, name: string}> */
		public array $store_calls = [];
		/** @var list<int> */
		public array $deleted = [];

		/** @param array{success: bool, url?: string, attachmentId?: int, error?: string} $result */
		public function __construct( private readonly array $result ) {}

		public function store_photo( string $base64_data, string $mime_type, string $original_name ): array {
			$this->store_calls[] = array(
				'base64' => $base64_data,
				'mime'   => $mime_type,
				'name'   => $original_name,
			);
			return $this->result;
		}

		public function delete_photo( int $attachment_id ): bool {
			$this->deleted[] = $attachment_id;
			return true;
		}
	};
}

/**
 * Stub bot protection that returns a fixed check() result and records calls.
 *
 * @param array{allowed: bool, errorCode?: string, retryAfterSeconds?: int} $result
 */
function spy_bot_protection( array $result ): object {
	return new class ( $result ) extends BotProtection {
		/** @var list<array{data: array<string,mixed>, ip: string}> */
		public array $calls = [];

		/** @param array{allowed: bool, errorCode?: string, retryAfterSeconds?: int} $result */
		public function __construct( private readonly array $result ) {}

		/** @param array<string,mixed> $submission_data */
		public function check( array $submission_data, string $ip_address ): array {
			$this->calls[] = array( 'data' => $submission_data, 'ip' => $ip_address );
			return $this->result;
		}
	};
}

/**
 * Stub duplicate detector (Step 5.13g) that returns a fixed check() result and
 * records calls, so controller tests can assert on orchestration (persist
 * flags, forward skip, response shape) without touching real $wpdb — real
 * detection logic is DuplicateDetectorTest's job.
 *
 * @param array{isDuplicate: bool, originalSubmissionId?: int} $result
 */
function spy_duplicate_detector( array $result ): object {
	return new class ( $result ) extends DuplicateDetector {
		/** @var list<array{email: string, phone: string}> */
		public array $calls = [];

		/** @param array{isDuplicate: bool, originalSubmissionId?: int} $result */
		public function __construct( private readonly array $result ) {
			// Parent constructor not called: check() is overridden below and
			// never touches the real SubmissionRepository dependency.
		}

		public function check( string $email, string $phone ): array {
			$this->calls[] = array( 'email' => $email, 'phone' => $phone );
			return $this->result;
		}
	};
}

/**
 * Stub consent validator (Step 5.14) that returns a fixed is_given() result
 * and records calls, so controller tests can assert on orchestration
 * (reject-before-persist, consent metadata written) without depending on
 * the real answer-key/checkbox-array logic — that's ConsentValidatorTest's job.
 */
function spy_consent_validator( bool $result ): object {
	return new class ( $result ) extends ConsentValidator {
		/** @var list<array<string,mixed>> */
		public array $calls = [];

		public function __construct( private readonly bool $result ) {}

		/** @param array<string,mixed> $answers */
		public function is_given( array $answers ): bool {
			$this->calls[] = $answers;
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
		Functions\when( 'wp_unslash' )->returnArg();
		Functions\when( 'wp_json_encode' )->alias(
			static fn( mixed $data ): string => (string) json_encode( $data )
		);
		Functions\when( 'current_time' )->justReturn( '2026-05-29 12:00:00' );
		// SubmissionController's default BotProtection collaborator (Step 5.13f)
		// resolves its config from Settings (get_option) and, when enabled,
		// checks/records via RateLimiter (get_transient/set_transient). None of
		// the tests in this file exercise bot protection directly — they use
		// the real default (enabled, no Turnstile, 5/hour) with these harmless
		// stubs so every pre-existing test keeps passing. Tests that need to
		// exercise bot-protection behaviour inject an explicit BotProtection
		// double instead (see the "Bot protection" section below).
		Functions\when( 'get_option' )->alias(
			static fn ( string $key, mixed $default = '' ): mixed => $default
		);
		Functions\when( 'get_transient' )->justReturn( false );
		Functions\when( 'set_transient' )->justReturn( true );
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
	'returns 400 when contractVersion is 2 (superseded by v3)',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload( array( 'contractVersion' => 2 ) ) );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'accepts contractVersion 3 and returns 200',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload( array( 'contractVersion' => 3 ) ) );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
	}
);

it(
	'returns 400 when quoteMode is missing from the payload',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$payload = valid_payload();
		unset( $payload['quoteMode'] );
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'accepts quoteMode manual without pricing and returns 200',
	function (): void {
		$repo    = spy_repository( 5 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$payload = valid_payload(
			array(
				'quoteMode' => 'manual',
				'pricing'   => null,
			)
		);
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts[0]['pricing_json'] )->toBeNull();
	}
);

it(
	'stores null pricing_json for instant quoteMode when pricing is absent from payload',
	function (): void {
		$repo    = spy_repository( 6 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$payload = valid_payload();
		unset( $payload['pricing'] );
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts[0]['pricing_json'] )->toBeNull();
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

// ---------------------------------------------------------------------------
// Media validation (Step 4.8)
// ---------------------------------------------------------------------------

it(
	'returns 400 with mediaIssues when media validation fails, and does not persist',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );

		// Payload with an oversized encoded photo (exceeds per-photo limit).
		// Use a small limit (100 bytes) so the test does not allocate megabytes.
		$validator = new \Agency\QuoteWizard\Submissions\MediaValidator( max_photo_bytes: 100 );
		$ctrl      = new SubmissionController( $repo, $fwd, $validator );
		$payload   = valid_payload(
			array(
				'answers' => array(
					'photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'big.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => str_repeat( 'A', 101 ),
							),
						),
					),
				),
			)
		);
		$request  = make_request( $payload );
		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $response->get_data()['errorCode'] )->toBe( 'media_validation_failed' );
		expect( $response->get_data() )->toHaveKey( 'mediaIssues' );
		expect( $repo->inserts )->toBeEmpty();
		expect( $fwd->calls )->toBeEmpty();
	}
);

it(
	'does not call repository insert when media validation fails',
	function (): void {
		$repo = spy_repository();
		$fwd  = spy_forwarder( ForwardResult::success() );
		$ctrl = new SubmissionController( $repo, $fwd );

		$payload = valid_payload(
			array(
				'answers' => array(
					'photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'mimeType'     => 'application/pdf',
								'originalName' => 'doc.pdf',
								'dataBase64'   => base64_encode( 'not an image' ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
							),
						),
					),
				),
			)
		);

		$ctrl->handle( make_request( $payload ) );

		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'proceeds past media validation when answers contain no photo fields',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
	}
);

it(
	'persists media_json as null when answers have no photo fields',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$ctrl->handle( $request );

		expect( $repo->inserts[0] )->toHaveKey( 'media_json' );
		expect( $repo->inserts[0]['media_json'] )->toBeNull();
	}
);

it(
	'persists non-null media_json when photo files are present',
	function (): void {
		$repo = spy_repository( 1 );
		$fwd  = spy_forwarder( ForwardResult::success() );

		// Stub validator so the test focuses on media_json persistence, not image validation.
		$validator = new class extends \Agency\QuoteWizard\Submissions\MediaValidator {
			/** @return array{ok: bool, issues: list<array{fileIndex: int, code: string}>} */
			public function validate( array $answers ): array {
				return array( 'ok' => true, 'issues' => array() );
			}
		};
		$photo_storage = spy_photo_storage(
			array( 'success' => true, 'url' => 'https://example.test/photo.jpg', 'attachmentId' => 5 )
		);
		$ctrl    = new SubmissionController( $repo, $fwd, $validator, $photo_storage );
		$payload = valid_payload(
			array(
				'answers' => array(
					'fence_type' => 'wooden',
					'photos'     => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'test.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);
		$request = make_request( $payload );

		$ctrl->handle( $request );

		expect( $repo->inserts[0]['media_json'] )->not->toBeNull();
		$decoded = json_decode( $repo->inserts[0]['media_json'], true );
		expect( $decoded[0]['fieldKey'] )->toBe( 'photos' );
	}
);

// ---------------------------------------------------------------------------
// Photo URL storage (Step 5.13e)
// ---------------------------------------------------------------------------

it(
	'replaces dataBase64 with url and attachmentId in the persisted answers_json',
	function (): void {
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage(
			array( 'success' => true, 'url' => 'https://example.test/wp-content/uploads/goqw/2026/07/x.jpg', 'attachmentId' => 42 )
		);
		$ctrl    = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'x.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);

		$ctrl->handle( make_request( $payload ) );

		$answers = json_decode( $repo->inserts[0]['answers_json'], true );
		$file    = $answers['site_photos']['files'][0];

		expect( $file )->not->toHaveKey( 'dataBase64' );
		expect( $file['url'] )->toBe( 'https://example.test/wp-content/uploads/goqw/2026/07/x.jpg' );
		expect( $file['attachmentId'] )->toBe( 42 );
	}
);

it(
	'forwards the URL-replaced answers to the webhook, not base64',
	function (): void {
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage(
			array( 'success' => true, 'url' => 'https://example.test/x.jpg', 'attachmentId' => 7 )
		);
		$ctrl    = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'x.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);

		$ctrl->handle( make_request( $payload ) );

		$forwarded_file = $fwd->calls[0]['payload']['answers_json'];
		$decoded        = json_decode( $forwarded_file, true );

		expect( $decoded['site_photos']['files'][0] )->not->toHaveKey( 'dataBase64' );
		expect( $decoded['site_photos']['files'][0]['url'] )->toBe( 'https://example.test/x.jpg' );
	}
);

it(
	'calls store_photo with the file dataBase64, mimeType, and originalName',
	function (): void {
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage(
			array( 'success' => true, 'url' => 'https://example.test/x.jpg', 'attachmentId' => 1 )
		);
		$ctrl    = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'garden.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'abc123',
							),
						),
					),
				),
			)
		);

		$ctrl->handle( make_request( $payload ) );

		expect( $photo_storage->store_calls )->toHaveCount( 1 );
		expect( $photo_storage->store_calls[0] )->toBe(
			array( 'base64' => 'abc123', 'mime' => 'image/jpeg', 'name' => 'garden.jpg' )
		);
	}
);

it(
	'drops the failed photo but still submits successfully (D5)',
	function (): void {
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage( array( 'success' => false, 'error' => 'attachment_insert_failed' ) );
		$ctrl          = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload       = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'x.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);

		$response = $ctrl->handle( make_request( $payload ) );

		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts )->not->toBeEmpty();
		$answers = json_decode( $repo->inserts[0]['answers_json'], true );
		expect( $answers['site_photos']['files'] )->toBeEmpty();
	}
);

it(
	'does not mark any attachment for cleanup when the photo save fails (D5)',
	function (): void {
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage( array( 'success' => false, 'error' => 'attachment_insert_failed' ) );
		$ctrl          = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload       = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'x.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);

		$ctrl->handle( make_request( $payload ) );

		expect( $photo_storage->deleted )->toBeEmpty();
	}
);

it(
	'deletes photos already stored when the submission then fails to persist (D6)',
	function (): void {
		$repo          = spy_repository( throw_on_insert: true );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage(
			array( 'success' => true, 'url' => 'https://example.test/x.jpg', 'attachmentId' => 99 )
		);
		$ctrl    = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$payload = valid_payload(
			array(
				'answers' => array(
					'site_photos' => array(
						'files' => array(
							array(
								'fileId'       => 'f1',
								'originalName' => 'x.jpg',
								'mimeType'     => 'image/jpeg',
								'dataBase64'   => 'fakeb64',
							),
						),
					),
				),
			)
		);

		$response = $ctrl->handle( make_request( $payload ) );

		expect( $response->get_status() )->toBe( 500 );
		expect( $photo_storage->deleted )->toBe( [ 99 ] );
	}
);

it(
	'does not delete anything on persistence failure when no photos were stored',
	function (): void {
		$repo          = spy_repository( throw_on_insert: true );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$photo_storage = spy_photo_storage( array( 'success' => true, 'url' => 'unused', 'attachmentId' => 1 ) );
		$ctrl          = new SubmissionController( $repo, $fwd, stub_media_validator_ok(), $photo_storage );
		$request       = make_request( valid_payload() );

		$ctrl->handle( $request );

		expect( $photo_storage->deleted )->toBeEmpty();
	}
);

// ---------------------------------------------------------------------------
// Bot protection (Step 5.13f)
// ---------------------------------------------------------------------------

it(
	'passes the raw payload and client IP to BotProtection before validation',
	function (): void {
		$_SERVER['REMOTE_ADDR'] = '203.0.113.7';
		$repo          = spy_repository( 1 );
		$fwd           = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection( array( 'allowed' => true ) );
		$ctrl          = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$ctrl->handle( make_request( valid_payload( array( 'honeypotValue' => '' ) ) ) );

		expect( $bot_protection->calls )->toHaveCount( 1 );
		expect( $bot_protection->calls[0]['data']['honeypotValue'] )->toBe( '' );
		expect( $bot_protection->calls[0]['ip'] )->toBe( '203.0.113.7' );

		unset( $_SERVER['REMOTE_ADDR'] );
	}
);

it(
	'returns 400 validation_failed (fails silently) when the honeypot is filled',
	function (): void {
		$repo           = spy_repository();
		$fwd            = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection( array( 'allowed' => false, 'errorCode' => 'honeypot_filled' ) );
		$ctrl           = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$response = $ctrl->handle( make_request( valid_payload() ) );

		expect( $response->get_status() )->toBe( 400 );
		expect( $response->get_data()['errorCode'] )->toBe( 'validation_failed' );
		expect( $repo->inserts )->toBeEmpty();
		expect( $fwd->calls )->toBeEmpty();
	}
);

it(
	'returns 429 rate_limited with retryAfterSeconds when rate limited',
	function (): void {
		$repo           = spy_repository();
		$fwd            = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection(
			array( 'allowed' => false, 'errorCode' => 'rate_limited', 'retryAfterSeconds' => 900 )
		);
		$ctrl = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$response = $ctrl->handle( make_request( valid_payload() ) );

		expect( $response->get_status() )->toBe( 429 );
		expect( $response->get_data()['errorCode'] )->toBe( 'rate_limited' );
		expect( $response->get_data()['retryAfterSeconds'] )->toBe( 900 );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'returns 403 bot_verification_failed when the Turnstile token is missing',
	function (): void {
		$repo           = spy_repository();
		$fwd            = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection( array( 'allowed' => false, 'errorCode' => 'turnstile_missing' ) );
		$ctrl           = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$response = $ctrl->handle( make_request( valid_payload() ) );

		expect( $response->get_status() )->toBe( 403 );
		expect( $response->get_data()['errorCode'] )->toBe( 'bot_verification_failed' );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'returns 403 bot_verification_failed when the Turnstile token is invalid',
	function (): void {
		$repo           = spy_repository();
		$fwd            = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection( array( 'allowed' => false, 'errorCode' => 'turnstile_invalid' ) );
		$ctrl           = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$response = $ctrl->handle( make_request( valid_payload() ) );

		expect( $response->get_status() )->toBe( 403 );
		expect( $response->get_data()['errorCode'] )->toBe( 'bot_verification_failed' );
		expect( $repo->inserts )->toBeEmpty();
	}
);

it(
	'proceeds to normal processing and returns 200 when bot protection allows',
	function (): void {
		$repo           = spy_repository( 1 );
		$fwd            = spy_forwarder( ForwardResult::success() );
		$bot_protection = spy_bot_protection( array( 'allowed' => true ) );
		$ctrl           = new SubmissionController( $repo, $fwd, bot_protection: $bot_protection );

		$response = $ctrl->handle( make_request( valid_payload() ) );

		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts )->not->toBeEmpty();
	}
);

// ---------------------------------------------------------------------------
// Output buffering (5.12b)
// ---------------------------------------------------------------------------

it(
	'does not leave open output buffers after a successful response',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$level_before = ob_get_level();
		$ctrl->handle( $request );
		$level_after = ob_get_level();

		expect( $level_after )->toBe( $level_before );
	}
);

it(
	'does not leave open output buffers after a persistence failure',
	function (): void {
		$repo    = spy_repository( throw_on_insert: true );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$ctrl    = new SubmissionController( $repo, $fwd );
		$request = make_request( valid_payload() );

		$level_before = ob_get_level();
		$ctrl->handle( $request );
		$level_after = ob_get_level();

		expect( $level_after )->toBe( $level_before );
	}
);

// ---------------------------------------------------------------------------
// Duplicate detection (Step 5.13g, ADR-0028)
// ---------------------------------------------------------------------------

it(
	'passes contact_email and contact_phone from answers to the duplicate detector',
	function (): void {
		$repo = spy_repository( 1 );
		$fwd  = spy_forwarder( ForwardResult::success() );
		$dup  = spy_duplicate_detector( array( 'isDuplicate' => false ) );
		$ctrl = new SubmissionController( $repo, $fwd, duplicate_detector: $dup );

		$request = make_request(
			valid_payload(
				array(
					'answers' => array(
						'contact_email' => 'jane@example.com',
						'contact_phone' => '07123456789',
					),
				)
			)
		);

		$ctrl->handle( $request );

		expect( $dup->calls )->toHaveCount( 1 );
		expect( $dup->calls[0] )->toBe(
			array( 'email' => 'jane@example.com', 'phone' => '07123456789' )
		);
	}
);

it(
	'persists is_duplicate=true and duplicate_of, skips forward, and returns 200 with isDuplicate',
	function (): void {
		$repo = spy_repository( 55 );
		$fwd  = spy_forwarder( ForwardResult::success() );
		$dup  = spy_duplicate_detector( array( 'isDuplicate' => true, 'originalSubmissionId' => 12 ) );
		$ctrl = new SubmissionController( $repo, $fwd, duplicate_detector: $dup );
		$request = make_request( valid_payload() );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $response->get_data() )->toBe( array( 'reference' => 'GOQW-55', 'isDuplicate' => true ) );
		expect( $repo->inserts[0]['is_duplicate'] )->toBeTrue();
		expect( $repo->inserts[0]['duplicate_of'] )->toBe( 12 );
		expect( $fwd->calls )->toBeEmpty();
		expect( $repo->forwarded )->toBeEmpty();
	}
);

it(
	'persists is_duplicate=false and duplicate_of=null, and still forwards normally, for a non-duplicate',
	function (): void {
		$repo = spy_repository( 56 );
		$fwd  = spy_forwarder( ForwardResult::success() );
		$dup  = spy_duplicate_detector( array( 'isDuplicate' => false ) );
		$ctrl = new SubmissionController( $repo, $fwd, duplicate_detector: $dup );
		$request = make_request( valid_payload() );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $response->get_data() )->not->toHaveKey( 'isDuplicate' );
		expect( $repo->inserts[0]['is_duplicate'] )->toBeFalse();
		expect( $repo->inserts[0]['duplicate_of'] )->toBeNull();
		expect( $fwd->calls )->toHaveCount( 1 );
		expect( $repo->forwarded )->toContain( 56 );
	}
);

// ---------------------------------------------------------------------------
// Consent validation (Step 5.14, ADR-0029)
// ---------------------------------------------------------------------------

it(
	'returns 400 consent_required and neither persists nor forwards when consent is missing',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$consent = spy_consent_validator( false );
		$ctrl    = new SubmissionController( $repo, $fwd, consent_validator: $consent );
		$request = make_request( valid_payload( array( 'answers' => array( 'data_processing_consent' => array() ) ) ) );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $response->get_data() )->toBe( array( 'errorCode' => 'consent_required' ) );
		expect( $repo->inserts )->toBeEmpty();
		expect( $fwd->calls )->toBeEmpty();
	}
);

it(
	'passes the answers map to the consent validator before duplicate detection',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$consent = spy_consent_validator( true );
		$dup     = spy_duplicate_detector( array( 'isDuplicate' => false ) );
		$ctrl    = new SubmissionController( $repo, $fwd, consent_validator: $consent, duplicate_detector: $dup );

		$ctrl->handle( make_request( valid_payload() ) );

		expect( $consent->calls )->toHaveCount( 1 );
		expect( $consent->calls[0] )->toHaveKey( 'data_processing_consent' );
		expect( $dup->calls )->toHaveCount( 1 );
	}
);

it(
	'persists consent_given=true and a consent_timestamp when consent is given',
	function (): void {
		$repo    = spy_repository( 1 );
		$fwd     = spy_forwarder( ForwardResult::success() );
		$request = make_request( valid_payload() );
		$ctrl    = new SubmissionController( $repo, $fwd );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 200 );
		expect( $repo->inserts[0]['consent_given'] )->toBeTrue();
		expect( $repo->inserts[0]['consent_timestamp'] )->toBe( '2026-05-29 12:00:00' );
	}
);

it(
	'does not reach the consent check when shape validation fails first',
	function (): void {
		$repo    = spy_repository();
		$fwd     = spy_forwarder( ForwardResult::success() );
		$consent = spy_consent_validator( false );
		$ctrl    = new SubmissionController( $repo, $fwd, consent_validator: $consent );
		$payload = valid_payload();
		unset( $payload['wizardId'] );
		$request = make_request( $payload );

		$response = $ctrl->handle( $request );

		expect( $response->get_status() )->toBe( 400 );
		expect( $response->get_data()['errorCode'] )->toBe( 'validation_failed' );
		expect( $consent->calls )->toBeEmpty();
	}
);
