<?php
/**
 * Per-route SEO content defaults for React-hosted routes.
 *
 * Per ADR-0023 (SEO infrastructure).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\SEO;

use Agency\QuoteWizard\Routing\SiteRoutes;

defined( 'ABSPATH' ) || exit;

/**
 * Route-to-SEO-content map for React-hosted routes.
 *
 * DEFAULTS below is real SCB Handyman content for the 6 core routes (fixed
 * during the Cloudflare Tunnel live-test pass — the "Acme Fencing" template
 * demo values had never been updated here, even though the 5 SEO service
 * landing pages further down already had real content; nobody had set the
 * corresponding goqw_seo_title_* and goqw_seo_description_* options either, so
 * every core route's OG title/description was silently serving the demo
 * copy). Per-client clones of this template still override via goqw_seo_*
 * options (e.g., goqw_seo_title_home, goqw_seo_description_quote) if a
 * deployment prefers to edit copy from wp-admin/WP-CLI without a code
 * change; for this specific, already-finalised client site, editing
 * DEFAULTS directly is the correct source of truth, matching how the 5
 * service pages already work.
 *
 * Three-tier resolution at emit time (ADR-0023):
 *   1. Per-client goqw option (takes precedence when set and non-empty).
 *   2. Template default defined in DEFAULTS (now real content, not demo).
 *   3. get_bloginfo('name') fallback is NOT used here; the option falls through
 *      to the DEFAULTS string if no override is set.
 */
final class SEORouteContent {

	/**
	 * Default route-to-SEO-content map.
	 *
	 * Per-client clones override individual fields via goqw options.
	 *
	 * @var array<string, array{title: string, description: string, og_type: string}>
	 */
	private const DEFAULTS = array(
		'/'                                               => array(
			'title'       => 'SCB Handyman — Guildford & Surrey Handyman and Garden Specialists',
			'description' => 'Home and garden maintenance across Guildford, Surrey and surrounding areas — no job too small. Established 2006 by a Merrist Wood trained landscape gardener. Get a free instant price estimate.',
			'og_type'     => 'website',
		),
		'/services'                                       => array(
			'title'       => 'Our Services — SCB Handyman',
			'description' => 'Fencing, decking, painting, driveways, pressure washing and general repairs across Guildford, Surrey and surrounding areas, from SCB Handyman.',
			'og_type'     => 'website',
		),
		'/our-work'                                       => array(
			'title'       => 'Our Recent Work — SCB Handyman',
			'description' => 'See examples of recent home and garden projects across Guildford, Surrey and surrounding areas, completed by SCB Handyman.',
			'og_type'     => 'website',
		),
		'/contact'                                        => array(
			'title'       => 'Contact — SCB Handyman',
			'description' => 'Get in touch with SCB Handyman for a free instant price estimate or to discuss your home or garden project in Guildford and Surrey.',
			'og_type'     => 'website',
		),
		'/quote'                                          => array(
			'title'       => 'Get a Free Instant Price Estimate — SCB Handyman',
			'description' => 'Use our online quote wizard to receive an instant estimate for your home or garden project, anywhere across Guildford, Surrey and surrounding areas.',
			'og_type'     => 'website',
		),
		'/privacy'                                        => array(
			'title'       => 'Privacy Policy — SCB Handyman',
			'description' => 'How SCB Handyman collects, uses, and protects your personal data.',
			'og_type'     => 'website',
		),
		// ---------------------------------------------------------------
		// SEO service landing pages (Step 6.8). Title/description mirrored
		// from apps/wizard/src/site/content/service-pages-content.ts's
		// `seo` field — update both in the same commit (same sync
		// discipline already used between the JS service registry and
		// ServiceSchemaEmitter.php's service entries).
		// ---------------------------------------------------------------
		'/services/fence-panel-repair-guildford'          => array(
			'title'       => 'Fence Panel Repair & Replacement in Guildford — SCB Handyman',
			'description' => 'Fast, reliable fence panel repair and replacement across Guildford and Surrey. Matching styles, secure posts, and honest quotes from SCB Handyman.',
			'og_type'     => 'website',
		),
		'/services/block-paving-guildford'                => array(
			'title'       => 'Block Paving Driveways in Guildford — SCB Handyman',
			'description' => 'Instant online quotes for block paving driveways across Guildford and Surrey. Driveline 50, Tegula and permeable Marshall Drivesys installed by SCB Handyman.',
			'og_type'     => 'website',
		),
		'/services/high-ceiling-painter-decorator-guildford' => array(
			'title'       => 'Painter & Decorator for High Ceilings — Guildford',
			'description' => 'Professional interior painting and decorating for high and vaulted ceilings across Guildford and Surrey. Instant online quote by room count from SCB Handyman.',
			'og_type'     => 'website',
		),
		'/services/driveway-decking-pressure-washing-guildford' => array(
			'title'       => 'Driveway & Decking Pressure Washing — Guildford',
			'description' => 'Professional pressure washing for driveways, patios and timber decking across Guildford and Surrey. Instant online quote from SCB Handyman.',
			'og_type'     => 'website',
		),
		'/services/emergency-plumbing-leak-repair-surrey' => array(
			'title'       => 'Emergency Plumbing Leak Repairs — Surrey | SCB Handyman',
			'description' => 'Fast response emergency plumbing leak repairs across Surrey and surrounding areas. Describe your problem online for a quick custom quote from SCB Handyman.',
			'og_type'     => 'website',
		),
	);

	/**
	 * Get SEO content for a route, with per-client option overrides applied.
	 *
	 * @param string $route Normalized route path (e.g., '/', '/services').
	 * @return array{title: string, description: string, og_type: string}|null
	 *         Content array for known routes; null for unrecognized routes.
	 */
	public static function get_content( string $route ): ?array {
		// Normalize defensively here (not just at the caller) so every
		// consumer gets correct behaviour regardless of whether the request
		// path still has a trailing slash. Bug found in Phase 11: WordPress's
		// pretty-permalink URLs (e.g. '/services/fence-panel-repair-guildford/')
		// never matched DEFAULTS' trailing-slash-free keys except for '/'
		// itself (which has no trailing slash to strip), so every non-root
		// route silently fell through to WordPress's default title/description
		// instead of its configured SEO content.
		$route = SiteRoutes::normalize( $route );

		if ( ! isset( self::DEFAULTS[ $route ] ) ) {
			return null;
		}

		$defaults = self::DEFAULTS[ $route ];
		$slug     = self::route_to_slug( $route );

		return array(
			'title'       => self::get_option_or_default( "goqw_seo_title_{$slug}", $defaults['title'] ),
			'description' => self::get_option_or_default( "goqw_seo_description_{$slug}", $defaults['description'] ),
			'og_type'     => $defaults['og_type'],
		);
	}

	/**
	 * Get the OG image URL.
	 *
	 * Returns the per-client goqw_seo_og_image option when set; otherwise the
	 * placeholder image shipped in plugin assets.
	 */
	public static function get_og_image_url(): string {
		$override = \get_option( 'goqw_seo_og_image' );
		if ( is_string( $override ) && '' !== $override ) {
			return $override;
		}
		return GOQW_PLUGIN_URL . 'assets/og-image-default.png';
	}

	/**
	 * Convert a route path to an option-key slug.
	 *
	 * '/'        -> 'home'
	 * '/services' -> 'services'
	 * '/our-work' -> 'our_work'
	 * '/contact'  -> 'contact'
	 * '/quote'    -> 'quote'
	 * '/services/fence-panel-repair-guildford' -> 'services_fence_panel_repair_guildford'
	 *
	 * @param string $route Route path to convert.
	 */
	private static function route_to_slug( string $route ): string {
		if ( '/' === $route ) {
			return 'home';
		}
		return str_replace( array( '/', '-' ), '_', trim( $route, '/' ) );
	}

	/**
	 * Get an option value or fall back to the fallback string.
	 *
	 * Returns the fallback when the option is absent, empty string, or not a string.
	 *
	 * @param string $option_key The wp_options key to read.
	 * @param string $fallback   Value to return when the option is unset or empty.
	 */
	private static function get_option_or_default( string $option_key, string $fallback ): string {
		$value = \get_option( $option_key );
		if ( ! is_string( $value ) || '' === $value ) {
			return $fallback;
		}
		return $value;
	}
}
