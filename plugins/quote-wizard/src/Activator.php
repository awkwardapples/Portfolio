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
use Agency\QuoteWizard\SEO\SitemapGenerator;
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
		self::create_photo_upload_directory();
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
		// SitemapGenerator registers its rewrite via add_action('init'), which has
		// already fired before the activation hook runs. Call it directly so the
		// sitemap rewrite is included in the flush and /sitemap.xml works immediately
		// after activation without requiring a manual wp rewrite flush.
		SitemapGenerator::add_rewrite_rule();
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
		add_option( 'goqw_enable_category_navigation', 0 );
		add_option( SiteRootPage::OPTION_KEY, 0 );
		// SEO Layer 2 options (LocalBusiness schema).
		add_option( 'goqw_business_address', '' );
		add_option( 'goqw_business_hours', '' );
		add_option( 'goqw_business_service_area', '' );
		add_option( 'goqw_business_price_range', '' );
		// SEO Layer 2 options (social links for sameAs).
		add_option( 'goqw_social_facebook', '' );
		add_option( 'goqw_social_instagram', '' );
		add_option( 'goqw_social_twitter', '' );
		add_option( 'goqw_social_linkedin', '' );
	}

	/**
	 * Schedule recurring cron jobs.
	 */
	private static function schedule_cron_events(): void {
		if ( ! wp_next_scheduled( 'goqw_prune_submissions' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'goqw_prune_submissions' );
		}
		if ( ! wp_next_scheduled( 'goqw_photo_retention_cleanup' ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', 'goqw_photo_retention_cleanup' );
		}
	}

	/**
	 * Create the /wp-content/uploads/goqw/ base directory (D1) so it exists
	 * before the first submission photo is saved. wp_handle_upload() would
	 * create it lazily anyway, but doing it here surfaces permission problems
	 * at activation time rather than during a user's first submission.
	 */
	private static function create_photo_upload_directory(): void {
		$upload_dir = wp_upload_dir();
		$goqw_path  = $upload_dir['basedir'] . '/goqw';
		if ( ! file_exists( $goqw_path ) ) {
			wp_mkdir_p( $goqw_path );
		}
	}
}
