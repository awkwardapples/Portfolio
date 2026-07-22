<?php
/**
 * Unit tests for InputSanitizer.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Security\InputSanitizer;
use Brain\Monkey;
use Brain\Monkey\Functions;

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

/**
 * Simulate WordPress's real sanitize_text_field(): strips tags, collapses
 * every run of [\r\n\t ] to a single space, then trims. The rest of the
 * suite stubs this as an identity function (returnArg()); this file needs
 * the real collapsing/trimming behavior to verify InputSanitizer's ordering
 * assumption (see FORMULA_TRIGGERS's docblock), so it's stubbed separately
 * per test instead.
 */
function stub_real_sanitize_text_field(): void {
	Functions\when( 'sanitize_text_field' )->alias(
		static function ( string $str ): string {
			// wp_strip_all_tags(): drop entire <script>/<style> blocks (content
			// included), then strip remaining tag markup only (keeping text).
			$filtered = preg_replace( '@<(script|style)[^>]*?>.*?</\1>@si', '', $str );
			$filtered = strip_tags( (string) $filtered );
			// sanitize_text_field()'s own pass: collapse all whitespace, trim.
			$filtered = preg_replace( '/[\r\n\t ]+/', ' ', $filtered );
			return trim( (string) $filtered );
		}
	);
}

it( 'prefix-escapes a value starting with an equals sign', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '=SUM(A1:A100)' ) )->toBe( "'=SUM(A1:A100)" );
} );

it( 'prefix-escapes a value starting with a plus sign', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '+1 234 5678' ) )->toBe( "'+1 234 5678" );
} );

it( 'prefix-escapes a value starting with a minus sign', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '-1+1' ) )->toBe( "'-1+1" );
} );

it( 'prefix-escapes a value starting with an at sign', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '@example.com' ) )->toBe( "'@example.com" );
} );

it( 'prefix-escapes a value whose leading whitespace hides a formula trigger', function (): void {
	// "\t=SUM(...)" — some spreadsheet parsers strip leading whitespace
	// before evaluating a cell, so this must still be caught. It is:
	// sanitize_text_field() collapses/trims the leading tab first, leaving
	// "=SUM(1,2)" as the value the "=" check actually sees.
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( "\t=SUM(1,2)" ) )->toBe( "'=SUM(1,2)" );
} );

it( 'does not prefix-escape an ordinary string', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( 'Jane Doe' ) )->toBe( 'Jane Doe' );
} );

it( 'strips HTML tags from a string value', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '<script>alert(1)</script>hello' ) )->toBe( 'hello' );
} );

it( 'strips a bare script tag down to no markup', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	$result = $sanitizer->sanitize_for_outbound( '<img src=x onerror=alert(1)>' );

	expect( $result )->not->toContain( '<' )->not->toContain( '>' );
} );

it( 'strips null bytes from a string value', function (): void {
	Functions\when( 'sanitize_text_field' )->returnArg();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( "hello\x00world" ) )->toBe( 'helloworld' );
} );

it( 'leaves an empty string unchanged', function (): void {
	Functions\when( 'sanitize_text_field' )->returnArg();
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( '' ) )->toBe( '' );
} );

it( 'preserves integers unchanged', function (): void {
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( 42 ) )->toBe( 42 );
} );

it( 'preserves floats unchanged', function (): void {
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( 3.14 ) )->toBe( 3.14 );
} );

it( 'preserves booleans unchanged', function (): void {
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( true ) )->toBeTrue();
	expect( $sanitizer->sanitize_for_outbound( false ) )->toBeFalse();
} );

it( 'preserves null unchanged', function (): void {
	$sanitizer = new InputSanitizer();

	expect( $sanitizer->sanitize_for_outbound( null ) )->toBeNull();
} );

it( 'recursively sanitizes a flat array of strings', function (): void {
	Functions\when( 'sanitize_text_field' )->returnArg();
	$sanitizer = new InputSanitizer();

	$result = $sanitizer->sanitize_for_outbound( array( '=1+1', 'safe', '@evil' ) );

	expect( $result )->toBe( array( "'=1+1", 'safe', "'@evil" ) );
} );

it( 'recursively sanitizes a nested associative structure', function (): void {
	Functions\when( 'sanitize_text_field' )->returnArg();
	$sanitizer = new InputSanitizer();

	$result = $sanitizer->sanitize_for_outbound(
		array(
			'contact_name' => '=cmd|/c calc',
			'files'        => array(
				array(
					'originalName' => '+HYPERLINK("http://evil")',
					'mimeType'     => 'image/jpeg',
				),
			),
		)
	);

	expect( $result )->toBe(
		array(
			'contact_name' => "'=cmd|/c calc",
			'files'        => array(
				array(
					'originalName' => "'+HYPERLINK(\"http://evil\")",
					'mimeType'     => 'image/jpeg',
				),
			),
		)
	);
} );

it( 'preserves array keys and nesting shape for already-safe values', function (): void {
	Functions\when( 'sanitize_text_field' )->returnArg();
	$sanitizer = new InputSanitizer();

	$result = $sanitizer->sanitize_for_outbound(
		array(
			'area_size' => 42,
			'brackets'  => array( 'small', 'medium' ),
		)
	);

	expect( $result )->toBe(
		array(
			'area_size' => 42,
			'brackets'  => array( 'small', 'medium' ),
		)
	);
} );

it( 'sanitize_submission_payload sanitizes an answers map end-to-end', function (): void {
	stub_real_sanitize_text_field();
	$sanitizer = new InputSanitizer();

	$result = $sanitizer->sanitize_submission_payload(
		array(
			'contact_name'    => 'Jane Doe',
			'additional_notes' => '=1+1',
			'quantity'        => 3,
		)
	);

	expect( $result )->toBe(
		array(
			'contact_name'    => 'Jane Doe',
			'additional_notes' => "'=1+1",
			'quantity'        => 3,
		)
	);
} );
