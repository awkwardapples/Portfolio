<?php
/**
 * Server-side payload validator.
 *
 * STUB FOR STEP 3D — real validation rules land in Step 5.1.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

defined( 'ABSPATH' ) || exit;

/**
 * Validates incoming submission payloads.
 *
 * In Step 5.1 this mirrors the Zod schemas used by the React app. Server-side
 * validation is the trust boundary — the React validation is UX only. A real
 * attacker bypasses the React app and hits the REST endpoint directly with a
 * crafted payload; everything Validator accepts is treated as canonical.
 *
 * Per ADR-0007: trust nothing from the client. Every field is type-checked,
 * length-bounded, and shape-checked against a known schema before any
 * downstream processing.
 */
final class Validator {

	/**
	 * Validate a decoded payload.
	 *
	 * @param array<string, mixed> $payload Decoded JSON body of the request.
	 * @return never
	 *
	 * @throws \LogicException Always — this is a stub for Step 5.1.
	 */
	public static function validate( array $payload ): never {
		unset( $payload );

		throw new \LogicException(
			'Validator::validate is not implemented yet — see Step 5.1.'
		);
	}
}
