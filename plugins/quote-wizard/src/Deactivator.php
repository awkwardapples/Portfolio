<?php
/**
 * Plugin deactivator.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard;

defined( 'ABSPATH' ) || exit;

/**
 * Deactivation tasks.
 *
 * Deactivation is reversible: data is preserved, scheduled events are cleared.
 * Full removal happens in uninstall.php only when the user clicks Delete.
 */
final class Deactivator {

	/**
	 * Entry point registered via register_deactivation_hook in quote-wizard.php.
	 */
	public static function deactivate(): void {
		wp_clear_scheduled_hook( 'goqw_prune_submissions' );
	}
}
