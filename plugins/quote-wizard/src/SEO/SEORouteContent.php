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

defined( 'ABSPATH' ) || exit;

/**
 * Route-to-SEO-content map for React-hosted routes.
 *
 * Default values are Acme Fencing demo content. Per-client clones override
 * via goqw_seo_* options (e.g., goqw_seo_title_home, goqw_seo_description_quote).
 *
 * Three-tier resolution at emit time (ADR-0023):
 *   1. Per-client goqw option (takes precedence when set and non-empty).
 *   2. Template default defined in DEFAULTS (Acme Fencing demo values).
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
		'/'         => array(
			'title'       => 'Acme Fencing — Professional Fencing Services',
			'description' => 'Professional fencing services across the south east. Get a free quote for fencing, decking, and outdoor structures.',
			'og_type'     => 'website',
		),
		'/services' => array(
			'title'       => 'Our Services — Acme Fencing',
			'description' => 'Fencing, decking, and outdoor construction services across the south east. Reliable, quality work.',
			'og_type'     => 'website',
		),
		'/our-work' => array(
			'title'       => 'Our Recent Work — Acme Fencing',
			'description' => 'See examples of fencing, decking, and outdoor construction projects we have completed.',
			'og_type'     => 'website',
		),
		'/contact'  => array(
			'title'       => 'Contact — Acme Fencing',
			'description' => 'Get in touch with Acme Fencing for a quote or to discuss your project.',
			'og_type'     => 'website',
		),
		'/quote'    => array(
			'title'       => 'Get a Free Quote — Acme Fencing',
			'description' => 'Use our online quote wizard to receive an instant estimate for your project.',
			'og_type'     => 'website',
		),
		'/privacy'  => array(
			'title'       => 'Privacy Policy — Acme Fencing',
			'description' => 'How Acme Fencing collects, uses, and protects your personal data.',
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
		$override = get_option( 'goqw_seo_og_image' );
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
	 *
	 * @param string $route Route path to convert.
	 */
	private static function route_to_slug( string $route ): string {
		if ( '/' === $route ) {
			return 'home';
		}
		return str_replace( '-', '_', trim( $route, '/' ) );
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
		$value = get_option( $option_key );
		if ( ! is_string( $value ) || '' === $value ) {
			return $fallback;
		}
		return $value;
	}
}
