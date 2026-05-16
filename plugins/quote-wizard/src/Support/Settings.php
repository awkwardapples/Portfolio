<?php
/**
 * Typed access to plugin settings.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Support;

defined( 'ABSPATH' ) || exit;

/**
 * Resolves plugin settings from the configured precedence chain.
 *
 * Precedence (highest first):
 *   1. PHP constant in wp-config.php (e.g. GOQW_MAKE_WEBHOOK_URL)
 *   2. wp_options entry (e.g. goqw_webhook_url, set via Settings page or WP-CLI)
 *   3. Compiled-in default (never a real value)
 *
 * Why this matters (per Step 3D operational constraint #1):
 *
 *   - Secrets (webhook URLs) never need to live in a public repository or
 *     wp_options dump if the operator prefers wp-config.php constants.
 *   - Production can pin values via constants so accidental wp-admin edits
 *     can't change them.
 *   - Staging and local environments can override production behaviour
 *     without touching the database.
 *
 * Constants are NEVER set by the plugin itself; the operator defines them
 * in wp-config.php. This file only READS them.
 *
 * No secret ever travels to the browser via this class — callers that need
 * to expose anything to the frontend must explicitly pick public-safe fields.
 */
final class Settings {

	/**
	 * Get the Make.com webhook URL.
	 *
	 * Constant: GOQW_MAKE_WEBHOOK_URL
	 * Option:   goqw_webhook_url
	 *
	 * SENSITIVE: never expose this value to the browser.
	 */
	public static function webhook_url(): string {
		return self::resolve( 'GOQW_MAKE_WEBHOOK_URL', 'goqw_webhook_url', '' );
	}

	/**
	 * Get the agency operations notification email.
	 *
	 * Constant: GOQW_AGENCY_NOTIFICATION_EMAIL
	 * Option:   goqw_agency_notification_email
	 */
	public static function agency_notification_email(): string {
		return self::resolve(
			'GOQW_AGENCY_NOTIFICATION_EMAIL',
			'goqw_agency_notification_email',
			(string) get_option( 'admin_email', '' )
		);
	}

	/**
	 * Get the business display name (public — appears in the wizard UI).
	 *
	 * Option only: goqw_business_name (no constant — clients edit this themselves).
	 */
	public static function business_name(): string {
		return (string) get_option( 'goqw_business_name', (string) get_option( 'blogname', '' ) );
	}

	/**
	 * Get the business phone for the fallback CTA (public).
	 */
	public static function business_phone(): string {
		return (string) get_option( 'goqw_business_phone', '' );
	}

	/**
	 * Get the business contact email (public).
	 */
	public static function business_email(): string {
		return (string) get_option( 'goqw_business_email', '' );
	}

	/**
	 * Get the primary brand colour (public).
	 *
	 * Default keeps the dev-time placeholder used in apps/wizard/index.html.
	 */
	public static function primary_color(): string {
		return (string) get_option( 'goqw_primary_color', '#0F4C81' );
	}

	/**
	 * Get the Calendly URL for the post-submission CTA (public, optional).
	 */
	public static function calendly_url(): string {
		return (string) get_option( 'goqw_calendly_url', '' );
	}

	/**
	 * Get the submission retention period in days.
	 *
	 * Configurable so the pruning cron job can be tuned per deployment.
	 * Default 90 days per the operational policy.
	 */
	public static function retention_days(): int {
		return (int) get_option( 'goqw_retention_days', 90 );
	}

	/**
	 * Return a struct safe to pass to the browser via wp_localize_script.
	 *
	 * Explicitly enumerates the public-only fields. Adding a sensitive
	 * field accidentally would require a code change here, not a config
	 * change — that's the point.
	 *
	 * @return array{
	 *     businessName: string,
	 *     businessPhone: string,
	 *     businessEmail: string,
	 *     primaryColor: string,
	 *     calendlyUrl: string,
	 * }
	 */
	public static function public_config(): array {
		return array(
			'businessName'  => self::business_name(),
			'businessPhone' => self::business_phone(),
			'businessEmail' => self::business_email(),
			'primaryColor'  => self::primary_color(),
			'calendlyUrl'   => self::calendly_url(),
		);
	}

	/**
	 * Resolve a setting from the precedence chain.
	 *
	 * @param string $constant_name PHP constant to check first.
	 * @param string $option_name   wp_options key to check second.
	 * @param string $default_value Final fallback.
	 */
	private static function resolve( string $constant_name, string $option_name, string $default_value ): string {
		if ( defined( $constant_name ) ) {
			$value = constant( $constant_name );
			if ( is_string( $value ) && '' !== $value ) {
				return $value;
			}
		}

		$option_value = get_option( $option_name, '' );
		if ( is_string( $option_value ) && '' !== $option_value ) {
			return $option_value;
		}

		return $default_value;
	}
}
