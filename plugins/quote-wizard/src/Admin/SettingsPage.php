<?php
/**
 * Plugin settings page in wp-admin.
 *
 * STUB FOR STEP 3D — real settings UI lands in Step 5.7.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Admin;

defined( 'ABSPATH' ) || exit;

/**
 * Renders the plugin's Settings page under wp-admin.
 *
 * Step 5.7 will register a settings page under wp-admin > Settings >
 * Quote Wizard with form fields for the public-safe options (business
 * name, phone, primary colour, etc.).
 *
 * Sensitive values (webhook URL) are settable here too but the field
 * is read-only and hides the current value if a constant is overriding it,
 * surfacing the precedence chain to the operator.
 */
final class SettingsPage {

	/**
	 * Register the admin menu entry. Currently a no-op.
	 */
	public static function register(): void {
		// Real implementation in Step 5.7.
	}
}
