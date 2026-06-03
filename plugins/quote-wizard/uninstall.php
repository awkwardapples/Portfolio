<?php
/**
 * Uninstall handler.
 *
 * WordPress calls this file when the user explicitly deletes the plugin via
 * wp-admin > Plugins > Delete. It does NOT run on plugin deactivation.
 *
 * What gets removed:
 *   - The goqw_submissions database table.
 *   - All goqw_* options stored in wp_options.
 *
 * What is NOT removed:
 *   - Images uploaded via the wizard. These live in the WP media library and
 *     may have been referenced elsewhere by the client. Removing them on
 *     uninstall would be destructive. They're cleaned up via the housekeeping
 *     process documented in docs/operations.md.
 *   - HubSpot contacts, Make.com history, sent emails — these aren't ours
 *     to delete.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

// WP_UNINSTALL_PLUGIN is defined by WordPress when it includes this file.
// If it's missing, someone is trying to access this file directly — refuse.
defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

/**
 * Run the uninstall sequence in a closure-scoped function.
 *
 * Wrapping in a closure means our local variables are not flagged as
 * "non-prefixed globals" by static analysis. Locals stay local.
 */
( static function (): void {
	global $wpdb;

	// Delete the Site Root page if it exists.
	// The plugin's front-page setting change is intentionally NOT reverted:
	// site owners may rely on it, and uninstall should be safe, not destructive.
	$site_root_id = (int) get_option( 'goqw_site_root_page_id', 0 );
	if ( $site_root_id > 0 ) {
		wp_delete_post( $site_root_id, true );
	}

	// Clear the front-page admin notice transient if it was never dismissed.
	delete_transient( 'goqw_front_page_notice' );

	// Drop the submissions table.
	$goqw_table = $wpdb->prefix . 'goqw_submissions';
	// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.DirectDatabaseQuery
	$wpdb->query( "DROP TABLE IF EXISTS {$goqw_table}" );

	// Remove all goqw_* options. We iterate rather than enumerate so future
	// options added by later steps are cleaned up without revisiting this file.
	// phpcs:ignore WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.DirectDatabaseQuery.DirectQuery
	$goqw_option_names = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s",
			'goqw\_%'
		)
	);

	if ( is_array( $goqw_option_names ) ) {
		foreach ( $goqw_option_names as $goqw_option_name ) {
			delete_option( $goqw_option_name );
		}
	}

	// Clear scheduled events.
	wp_clear_scheduled_hook( 'goqw_prune_submissions' );
} )();
