<?php
/**
 * Server-side input sanitiser.
 *
 * STUB FOR STEP 3D — real sanitisation rules land in Step 5.1.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

defined( 'ABSPATH' ) || exit;

/**
 * Sanitises validated inputs before persistence and forwarding.
 *
 * Validator says "is this acceptable?". Sanitiser says "make it safe to store
 * and echo back". Both must run. Sanitisation without validation is a vulnerability
 * (you sanitise what shouldn't have been accepted at all). Validation without
 * sanitisation is fragile (a valid email can still contain whitespace edge cases
 * that break downstream string handling).
 *
 * Per ADR-0007: every field gets a sanitisation pass appropriate to its kind:
 *   - text: sanitize_text_field()
 *   - email: sanitize_email() + validate
 *   - phone: regex-stripped to digits + the leading + if present
 *   - postcode: uppercased, whitespace-collapsed (UK-specific for v1)
 *   - long text (e.g. notes): sanitize_textarea_field()
 *   - IP: inet_pton for binary storage
 *
 * Real implementations + tests ship in Step 5.1.
 */
final class Sanitiser {

	/**
	 * Sanitise a validated payload for persistence.
	 *
	 * @param array<string, mixed> $payload Validated payload from Validator.
	 * @return never
	 *
	 * @throws \LogicException Always — this is a stub for Step 5.1.
	 */
	public static function sanitise( array $payload ): never {
		unset( $payload );

		throw new \LogicException(
			'Sanitiser::sanitise is not implemented yet — see Step 5.1.'
		);
	}
}
