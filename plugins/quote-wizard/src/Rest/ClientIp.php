<?php
/**
 * Client IP resolution for the submit endpoint (Step 5.13f).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves the client IP address from the request superglobal.
 *
 * Deliberately minimal: reads $_SERVER['REMOTE_ADDR'] only. Reverse-proxy /
 * CDN headers (X-Forwarded-For, CF-Connecting-IP, etc.) are NOT trusted here
 * — doing so safely requires a trusted-proxy allowlist this template does not
 * yet have (see AUDIT-5.13f-endpoint-flow.md). Behind a proxy that doesn't
 * preserve the real client IP in REMOTE_ADDR, rate limiting will key off the
 * proxy's IP instead — a known limitation, not a silent correctness bug.
 */
final class ClientIp {

	/**
	 * Resolve the current request's client IP address.
	 *
	 * @return string  The IP address, or '' if unavailable (e.g. CLI context).
	 */
	public static function resolve(): string {
		if ( ! isset( $_SERVER['REMOTE_ADDR'] ) ) {
			return '';
		}

		return \sanitize_text_field( \wp_unslash( $_SERVER['REMOTE_ADDR'] ) );
	}
}
