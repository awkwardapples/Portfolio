<?php
/**
 * Plugin activator.
 *
 * Runs once when the plugin is activated in wp-admin (or via WP-CLI).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard;

use Agency\QuoteWizard\Routing\FrontPagePolicy;
use Agency\QuoteWizard\Routing\RewriteRegistrar;
use Agency\QuoteWizard\Routing\SiteRootPage;
use Agency\QuoteWizard\Submissions\Schema;

defined( 'ABSPATH' ) || exit;

/**
 * Activation tasks.
 *
 * Idempotent: re-activating the plugin re-runs these tasks safely.
 */
final class Activator {

	/**
	 * Entry point registered via register_activation_hook.
	 */
	public static function activate(): void {
		self::create_or_update_schema();
		self::set_default_options();
		self::schedule_cron_events();
		self::setup_site_routing();
	}

	/**
	 * Create or update the goqw_submissions table using dbDelta.
	 */
	private static function create_or_update_schema(): void {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( Schema::submissions_table_sql() );
	}

	/**
	 * Create the Site Root page, register rewrites, apply front-page policy.
	 * Idempotent: safe to re-run on reactivation.
	 */
	private static function setup_site_routing(): void {
		$page      = new SiteRootPage();
		$policy    = new FrontPagePolicy( $page );
		$registrar = new RewriteRegistrar();

		$page->ensure();
		$policy->apply_on_activation();
		$registrar->register();
		flush_rewrite_rules();
	}

	/**
	 * Seed default options if they don't already exist.
	 */
	private static function set_default_options(): void {
		add_option( 'goqw_webhook_url', '' );
		add_option( 'goqw_agency_notification_email', get_option( 'admin_email', '' ) );
		add_option( 'goqw_business_name', get_option( 'blogname', '' ) );
		add_option( 'goqw_business_phone', '' );
		add_option( 'goqw_business_email', get_option( 'admin_email', '' ) );
		add_option( 'goqw_primary_color', '#0F4C81' );
		add_option( 'goqw_calendly_url', '' );
		add_option( 'goqw_plugin_version', GOQW_VERSION );
		add_option( 'goqw_wizard_id', 'fencing' );
		add_option( 'goqw_enabled_services', '' );
		add_option( SiteRootPage::OPTION_KEY, 0 );
	}

	/**
	 * Schedule recurring cron jobs.
	 */
	private static function schedule_cron_events(): void {
		if ( ! wp_next_scheduled( 'goqw_prune_submissions' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'goqw_prune_submissions' );
		}
	}
}
