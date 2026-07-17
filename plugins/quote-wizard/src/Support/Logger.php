<?php
/**
 * Minimal logger.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Thin wrapper around error_log so log lines from this plugin are consistently
 * tagged and trivially greppable.
 *
 * Why not a full PSR-3 logger like Monolog: we have no runtime dependencies
 * in the plugin (see Step 3D plan §1.8). error_log is what WordPress uses
 * itself and routes to the configured PHP error log on every reasonable host.
 *
 * If a real PSR-3 logger becomes justified later (e.g. structured JSON logs
 * shipping to an aggregator), we add it then.
 */
final class Logger {

	private const PREFIX = '[quote-wizard]';

	/**
	 * Log an informational message. Only written when WP_DEBUG_LOG is enabled.
	 *
	 * @param string               $message Short message describing the event.
	 * @param array<string, mixed> $context Optional structured context (encoded as JSON).
	 */
	public static function info( string $message, array $context = array() ): void {
		if ( ! defined( 'WP_DEBUG_LOG' ) || ! WP_DEBUG_LOG ) {
			return;
		}
		self::write( 'INFO', $message, $context );
	}

	/**
	 * Log a warning. Always written.
	 *
	 * @param string               $message Short message describing the event.
	 * @param array<string, mixed> $context Optional structured context.
	 */
	public static function warning( string $message, array $context = array() ): void {
		self::write( 'WARN', $message, $context );
	}

	/**
	 * Log an error. Always written.
	 *
	 * @param string               $message Short message describing the event.
	 * @param array<string, mixed> $context Optional structured context.
	 */
	public static function error( string $message, array $context = array() ): void {
		self::write( 'ERROR', $message, $context );
	}

	/**
	 * Log an OPERATIONAL event — always written, with a distinct tag.
	 *
	 * Use this for rare, high-importance events the agency operator MUST see
	 * in the log regardless of WP_DEBUG_LOG state. Examples:
	 *   - Build assets missing or unreadable
	 *   - Make.com forwarder hard-failed after retries (Step 5.3)
	 *   - Rate-limit triggered at suspicious volume (Step 5.2)
	 *
	 * Lines emitted by this method use the prefix `[goqw-ops]` instead of
	 * `[quote-wizard]` so an operator can grep:
	 *
	 *     grep "goqw-ops" /path/to/debug.log
	 *
	 * to see just the operational signal, free of routine warnings/info.
	 *
	 * @param string               $message Short message describing the event.
	 * @param array<string, mixed> $context Optional structured context.
	 */
	public static function operational( string $message, array $context = array() ): void {
		$line = '[goqw-ops] ' . $message;

		if ( ! empty( $context ) ) {
			$encoded = \wp_json_encode( $context );
			if ( is_string( $encoded ) ) {
				$line .= ' ' . $encoded;
			}
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $line );
	}

	/**
	 * Internal: write a line. Never throws.
	 *
	 * @param string               $level   Severity label.
	 * @param string               $message Message.
	 * @param array<string, mixed> $context Context.
	 */
	private static function write( string $level, string $message, array $context ): void {
		$line = self::PREFIX . ' [' . $level . '] ' . $message;

		if ( ! empty( $context ) ) {
			$encoded = \wp_json_encode( $context );
			if ( is_string( $encoded ) ) {
				$line .= ' ' . $encoded;
			}
		}

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $line );
	}
}
