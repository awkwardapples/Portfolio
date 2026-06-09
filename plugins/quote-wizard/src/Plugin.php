<?php
/**
 * Plugin bootstrap.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard;

use Agency\QuoteWizard\Frontend\AssetLoader;
use Agency\QuoteWizard\Frontend\Shortcode;
use Agency\QuoteWizard\Rest\SubmissionController;
use Agency\QuoteWizard\Routing\FrontPagePolicy;
use Agency\QuoteWizard\Routing\RenderingArchitecture;
use Agency\QuoteWizard\Routing\RewriteRegistrar;
use Agency\QuoteWizard\Routing\RouteInterceptor;
use Agency\QuoteWizard\Routing\SelfHealer;
use Agency\QuoteWizard\Routing\SiteRenderer;
use Agency\QuoteWizard\Routing\SiteRootPage;
use Agency\QuoteWizard\Submissions\Forwarder;
use Agency\QuoteWizard\Submissions\SubmissionRepository;

defined( 'ABSPATH' ) || exit;

/**
 * Wires WordPress hooks for the plugin.
 */
final class Plugin {

	/**
	 * Register all hooks. Idempotent.
	 */
	public static function boot(): void {
		// Site routing — rewrite rules, route interception, self-healing.
		$page        = new SiteRootPage();
		$registrar   = new RewriteRegistrar();
		$interceptor = new RouteInterceptor( $page );
		$healer      = new SelfHealer( $page );
		$policy      = new FrontPagePolicy( $page );

		$renderer = new SiteRenderer( $page );

		add_action( 'init', array( $registrar, 'register' ) );
		add_filter( 'query_vars', array( $registrar, 'add_query_vars' ) );
		add_action( 'pre_get_posts', array( $interceptor, 'maybe_intercept' ) );
		add_action( 'init', array( $healer, 'check' ) );
		add_action( 'admin_notices', array( $policy, 'maybe_render_notice' ) );
		add_filter( 'the_content', array( $renderer, 'filter_content' ), 5 );

		// Rendering architecture: plugin-provided minimal template for React routes (ADR-0019).
		RenderingArchitecture::register();

		// Frontend: shortcode that renders the wizard mount point.
		add_shortcode( Shortcode::TAG, array( Shortcode::class, 'render' ) );

		// Frontend: enqueue the built React bundle when the shortcode is on the page.
		add_action( 'wp_enqueue_scripts', array( AssetLoader::class, 'maybe_enqueue' ) );

		// Admin: surface a notice anywhere in wp-admin when the build is missing.
		add_action( 'admin_notices', array( AssetLoader::class, 'render_admin_notice' ) );

		// REST: register the submit endpoint (ADR-0015).
		add_action(
			'rest_api_init',
			static function (): void {
				global $wpdb;
				$repository = new SubmissionRepository( $wpdb );
				$forwarder  = new Forwarder();
				$controller = new SubmissionController( $repository, $forwarder );

				register_rest_route(
					'qw/v1',
					'/submit',
					array(
						'methods'             => 'POST',
						'callback'            => array( $controller, 'handle' ),
						// Nonce verification: the React app sends X-WP-Nonce (created
						// from wp_create_nonce('wp_rest') in PublicConfig::build()).
						// wp_verify_nonce returns 1 or 2 on success, false on failure.
						'permission_callback' => static function ( \WP_REST_Request $req ): bool {
							$nonce = $req->get_header( 'X-WP-Nonce' );
							return null !== $nonce && false !== wp_verify_nonce( $nonce, 'wp_rest' );
						},
					)
				);
			}
		);
	}
}
