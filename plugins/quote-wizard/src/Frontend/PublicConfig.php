<?php
/**
 * The frontend-safe configuration struct.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

use Agency\QuoteWizard\Support\Settings;

defined( 'ABSPATH' ) || exit;

/**
 * Builds the configuration object that gets exposed to the React app as
 * `window.GOQW_CONFIG`.
 *
 * Architectural enforcement of operational constraint #1 (env var discipline):
 *
 *   Adding a new field to what the browser sees REQUIRES a code change in this
 *   one method. There is no automatic mechanism that exposes new options.
 *
 *   Fields explicitly NOT exposed (see ADR-0009):
 *     - Make.com webhook URL (sensitive endpoint)
 *     - Agency notification email (internal)
 *     - Any GOQW_* constants from wp-config.php
 *     - Any HubSpot / SMTP credentials (these don't live in WP anyway)
 *
 * The contract version is a hard integer; bumping it signals that the React
 * side must handle a breaking change.
 */
final class PublicConfig {

	/**
	 * The current contract version. Bump if any field is renamed, removed,
	 * or changes semantics. Adding a new optional field does NOT require a bump.
	 */
	public const CONTRACT_VERSION = 2;

	/**
	 * Build the public configuration array.
	 *
	 * @return array<string, mixed>
	 */
	public static function build(): array {
		return array(
			// Contract version — React reads this and warns on mismatch.
			'contractVersion' => self::CONTRACT_VERSION,

			// Wizard vertical selector — matches a key in the JS registry.
			'wizardId'        => get_option( 'goqw_wizard_id', 'fencing' ),

			// Business display info (public — appears in the wizard UI).
			'businessName'    => Settings::business_name(),
			'businessPhone'   => Settings::business_phone(),
			'businessEmail'   => Settings::business_email(),

			// Branding.
			'primaryColor'    => Settings::primary_color(),

			// CTAs.
			'calendlyUrl'     => Settings::calendly_url(),

			// REST contract — used by the future submission flow.
			'restNamespace'   => 'qw/v1',
			'restUrl'         => esc_url_raw( rest_url( 'qw/v1' ) ),
			'restNonce'       => wp_create_nonce( 'wp_rest' ),

			// Build identity — appears in console for deployment debugging.
			'pluginVersion'   => GOQW_VERSION,
			'buildTimestamp'  => self::build_timestamp(),
		);
	}

	/**
	 * The build timestamp lives in the manifest if Vite was configured to
	 * emit it; if not, we fall back to the manifest file's mtime.
	 */
	private static function build_timestamp(): string {
		$path = ManifestReader::manifest_path();
		if ( is_readable( $path ) ) {
			$mtime = filemtime( $path );
			if ( false !== $mtime ) {
				return gmdate( 'c', $mtime );
			}
		}
		return '';
	}

	/**
	 * JSON-encode the config for safe inline emission.
	 *
	 * Uses JSON_HEX_TAG and friends to neutralise any unlikely-but-possible
	 * inline-script-breaking characters. Returns an empty object literal if
	 * encoding fails, so the React app gets a defined-but-empty config rather
	 * than an undefined window global.
	 */
	public static function to_inline_json(): string {
		$flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;

		$encoded = wp_json_encode( self::build(), $flags );

		if ( false === $encoded || '' === $encoded ) {
			return '{}';
		}

		return $encoded;
	}
}
