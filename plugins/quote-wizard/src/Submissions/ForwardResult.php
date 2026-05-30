<?php
/**
 * Plain-data result from a forward attempt.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Submissions;

defined( 'ABSPATH' ) || exit;

/**
 * Immutable value object returned by Forwarder::forward().
 *
 * Using a named result type (not a bool or array) lets the controller
 * pattern-match clearly and avoids positional tuple confusion.
 */
final class ForwardResult {

	/**
	 * Private constructor — use ForwardResult::success() or ::failure().
	 *
	 * @param bool   $success       Whether the forward succeeded.
	 * @param string $error_message Error description when not successful.
	 */
	private function __construct(
		private readonly bool $success,
		private readonly string $error_message
	) {}

	/**
	 * Create a successful forward result.
	 */
	public static function success(): self {
		return new self( true, '' );
	}

	/**
	 * Create a failed forward result.
	 *
	 * @param string $message Human-readable reason for failure.
	 */
	public static function failure( string $message ): self {
		return new self( false, $message );
	}

	/**
	 * Whether the forward succeeded.
	 */
	public function is_success(): bool {
		return $this->success;
	}

	/**
	 * Error description; empty string when is_success() is true.
	 */
	public function error_message(): string {
		return $this->error_message;
	}
}
