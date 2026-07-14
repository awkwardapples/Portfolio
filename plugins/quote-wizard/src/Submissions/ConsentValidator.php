<?php
/**
 * Data-processing consent validation (Step 5.14, ADR-0029).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Server-side check that a submission's answers carry explicit consent to
 * data processing (D9: client-side validation is UX only; the server is the
 * trust boundary — a crafted request that bypasses the wizard UI entirely
 * must still be rejected).
 *
 * The consent field is a standard wizard `checkbox` field (AUDIT-5.14-consent-
 * integration.md): its answer is an array of selected option values, not a
 * plain boolean, matching every other checkbox field in the wizard engine
 * (e.g. fencing's `include_gate`). A single-option checkbox therefore reads
 * as `['agreed']` when checked, `[]` or absent when not.
 */
class ConsentValidator {

	/**
	 * The answer key the consent checkbox field is stored under (must match
	 * the `key` used in every wizard config's consent field).
	 */
	public const FIELD_KEY = 'data_processing_consent';

	/**
	 * The single option value the consent checkbox field submits when checked.
	 */
	private const CONSENT_VALUE = 'agreed';

	/**
	 * Whether valid consent is present in the given answers map.
	 *
	 * @param array<string,mixed> $answers  Decoded `answers` map from the submission payload.
	 */
	public function is_given( array $answers ): bool {
		$answer = $answers[ self::FIELD_KEY ] ?? null;

		return is_array( $answer ) && in_array( self::CONSENT_VALUE, $answer, true );
	}
}
