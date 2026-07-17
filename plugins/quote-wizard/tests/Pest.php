<?php
/**
 * Pest configuration.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Per-suite base test class assignment. We use plain PHPUnit\TestCase for
| all unit tests; we don't yet have a custom base test class.
|
*/

uses()->in( 'Unit' );

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| Custom expectations would live here. None for v1.
|
*/

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| Shared test helpers.
|
*/

/**
 * Asserts that every call site of each given function name in $source is
 * backslash-prefixed (Step 5.14.1, AUDIT-5.14.1-admin-includes.md). Ignores
 * occurrences that are part of a longer identifier (e.g. `add_rewrite_rule`
 * inside `SitemapGenerator::add_rewrite_rule`) and non-call occurrences
 * (comments, strings used only as text).
 *
 * @param string        $source     Raw PHP file contents.
 * @param array<string> $functions  Function names expected to appear, prefixed.
 */
function assert_wp_calls_are_prefixed( string $source, array $functions ): void {
	// Drop comment-only lines so prose mentioning a function name (e.g.
	// "// wp_tempnam() lives in...") isn't mistaken for a call site.
	$code_lines = array_filter(
		explode( "\n", $source ),
		static fn ( string $line ): bool => ! preg_match( '/^\s*(\*|\/\/|#)/', $line )
	);
	$code = implode( "\n", $code_lines );

	foreach ( $functions as $fn ) {
		$offset = 0;
		$found_prefixed = false;
		while ( ( $pos = strpos( $code, $fn, $offset ) ) !== false ) {
			$prev  = $pos > 0 ? $code[ $pos - 1 ] : '';
			$after = substr( $code, $pos + strlen( $fn ) );
			$offset = $pos + 1;

			// Skip if part of a longer identifier (e.g. matching "add_rewrite_rule"
			// inside a longer name, or a `::add_rewrite_rule` method reference).
			if ( ctype_alnum( $prev ) || '_' === $prev || ':' === $prev ) {
				continue;
			}

			// Only count actual call sites (name followed by optional whitespace then "(").
			if ( ! preg_match( '/^\s*\(/', $after ) ) {
				continue;
			}

			expect( $prev )->toBe( '\\', "Unprefixed call to {$fn}() found in source" );
			$found_prefixed = true;
		}

		expect( $found_prefixed )->toBeTrue( "Expected at least one prefixed call to {$fn}() in source" );
	}
}
