<?php
/**
 * Outbound-payload sanitizer (Step 6.6, ADR-0037).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Security;

defined( 'ABSPATH' ) || exit;

/**
 * Sanitizes user-supplied values before they leave the plugin toward
 * external systems (Make.com → Google Sheets / WhatsApp).
 *
 * Not a validator (AUDIT-6.6-current-sanitization.md: shape/type checking
 * already happens in SubmissionController::validate()) and not the storage
 * boundary (the database keeps the raw, original values — AUDIT-6.6-data-
 * flow.md). This class only ever touches the copy of the answers built for
 * Forwarder::forward().
 *
 * Two independent defenses per string value:
 *   1. Formula injection (CSV/Sheets injection): a value whose first
 *      character is one Google Sheets/Excel treats as a formula prefix is
 *      itself prefixed with a leading apostrophe, which every spreadsheet
 *      application treats as "force text" rather than evaluating it.
 *   2. Stored XSS: sanitize_text_field() strips tags/scripts and collapses
 *      whitespace, so a WordPress admin view that later renders this data
 *      (none does today — see the ADR's defense-in-depth rationale) sees
 *      plain text, never markup.
 *
 * sanitize_text_field() runs before the formula-prefix check (not after):
 * this order means the formula check always sees the final, trimmed
 * leading character, so it can't be fooled by whitespace padding — see
 * FORMULA_TRIGGERS.
 */
final class InputSanitizer {

	/**
	 * First characters that spreadsheet applications interpret as the start
	 * of a formula. A value beginning with any of these is force-quoted.
	 *
	 * The OWASP CSV/Formula Injection Cheat Sheet's canonical set also lists
	 * tab and CR (its rationale: some parsers strip leading whitespace
	 * before evaluating a cell, so "\t=SUM(...)" can still execute as a
	 * formula even though it doesn't start with "="). Both are deliberately
	 * omitted here because this check runs on the output of
	 * sanitize_text_field(), which collapses every run of
	 * [\r\n\t ] to a single space and then trims the result — so a value
	 * cannot reach this check still bearing a leading tab/CR/LF; whatever
	 * character follows the stripped whitespace becomes the new leading
	 * character, and if that's "=" (as in the "\t=SUM(...)" example), the
	 * "=" branch below still catches it. Listing tab/CR/LF here as well
	 * would be unreachable code, not an extra defense.
	 *
	 * @var list<string>
	 */
	private const FORMULA_TRIGGERS = array( '=', '+', '-', '@' );

	/**
	 * Sanitize a value of arbitrary shape for outbound transmission.
	 *
	 * Strings are sanitized directly; arrays (including associative arrays /
	 * nested structures such as a photo field's `files` list) are walked
	 * recursively preserving their shape; every other type (int, float,
	 * bool, null) is structurally safe and returned unchanged.
	 *
	 * @param  mixed $value  Value to sanitize.
	 * @return mixed  Sanitized value, same structure as the input.
	 */
	public function sanitize_for_outbound( mixed $value ): mixed {
		if ( is_string( $value ) ) {
			return $this->sanitize_string_for_outbound( $value );
		}

		if ( is_array( $value ) ) {
			return array_map( array( $this, 'sanitize_for_outbound' ), $value );
		}

		return $value;
	}

	/**
	 * Sanitize a full answers map for outbound transmission.
	 *
	 * @param  array<string,mixed> $answers  Decoded answers map.
	 * @return array<string,mixed>  Sanitized answers map, same keys/shape.
	 */
	public function sanitize_submission_payload( array $answers ): array {
		/**
		 * Narrowing cast: sanitize_for_outbound() is typed `mixed` (it also
		 * handles scalars), but an array in always produces an array out.
		 *
		 * @var array<string,mixed> $sanitized
		 */
		$sanitized = $this->sanitize_for_outbound( $answers );

		return $sanitized;
	}

	/**
	 * Sanitize a single string for outbound transmission.
	 *
	 * Order matters: null-byte stripping first (safety), then WordPress's
	 * own tag/whitespace normalization, then the formula-prefix check —
	 * checking last means it runs against the already-trimmed value, so a
	 * value that only *started* with stray whitespace (not a deliberate
	 * formula-trigger character) can't produce a false positive.
	 *
	 * @param  string $value  Raw string value.
	 * @return string  Sanitized string.
	 */
	private function sanitize_string_for_outbound( string $value ): string {
		$value = str_replace( "\x00", '', $value );
		$value = \sanitize_text_field( $value );

		if ( '' !== $value && in_array( $value[0], self::FORMULA_TRIGGERS, true ) ) {
			$value = "'" . $value;
		}

		return $value;
	}
}
