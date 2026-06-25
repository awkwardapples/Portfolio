<?php
/**
 * LocalBusiness JSON-LD schema emitter.
 *
 * Emits structured data marking the site as a local business. Used by
 * search engines for local SEO — 'near me' results and local pack inclusion.
 *
 * Per ADR-0023 amendment (Step 5.10b).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\SEO;

use Agency\QuoteWizard\Routing\SiteRoutes;

defined( 'ABSPATH' ) || exit;

/**
 * Emits LocalBusiness JSON-LD into wp_head for React-hosted routes.
 *
 * Schema source: schema.org/LocalBusiness
 *
 * Fields emitted (T1 Option B — standard):
 *   - @type: LocalBusiness
 *   - name (goqw_business_name or site name)
 *   - description (goqw_business_description when set)
 *   - url (canonical homepage)
 *   - telephone (goqw_business_phone when set)
 *   - email (goqw_business_email when set)
 *   - address (PostalAddress from goqw_business_address when set)
 *   - openingHours (goqw_business_hours when set)
 *   - areaServed (goqw_business_service_area when set)
 *   - image (goqw_seo_og_image or plugin placeholder)
 *   - priceRange (goqw_business_price_range when set)
 *   - sameAs (social URLs from goqw_social_* options when set)
 *
 * Hooked into wp_head at priority 10 (after SEOMetaEmitter at priority 5).
 * Scope-guarded to fire only on React routes.
 */
final class LocalBusinessSchemaEmitter {

	/**
	 * Register the wp_head hook.
	 */
	public static function register(): void {
		add_action( 'wp_head', array( __CLASS__, 'emit' ), 10 );
	}

	/**
	 * Emit LocalBusiness JSON-LD into <head>.
	 */
	public static function emit(): void {
		if ( ! SiteRoutes::is_current_request_react_route() ) {
			return;
		}

		$schema = self::build_schema();

		echo "\n<script type=\"application/ld+json\">\n";
		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		echo wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
		echo "\n</script>\n";
	}

	/**
	 * Build the LocalBusiness schema array.
	 *
	 * Reads from goqw options; falls back to site name when business name
	 * option is not set.
	 *
	 * @return array<string, mixed>
	 */
	public static function build_schema(): array {
		$schema = array(
			'@context' => 'https://schema.org',
			'@type'    => 'LocalBusiness',
			'name'     => self::get_business_name(),
			'url'      => home_url( '/' ),
		);

		$description = get_option( 'goqw_business_description' );
		if ( is_string( $description ) && '' !== $description ) {
			$schema['description'] = $description;
		}

		$phone = get_option( 'goqw_business_phone' );
		if ( is_string( $phone ) && '' !== $phone ) {
			$schema['telephone'] = $phone;
		}

		$email = get_option( 'goqw_business_email' );
		if ( is_string( $email ) && '' !== $email ) {
			$schema['email'] = $email;
		}

		$address = self::build_address_schema();
		if ( null !== $address ) {
			$schema['address'] = $address;
		}

		$hours = get_option( 'goqw_business_hours' );
		if ( is_string( $hours ) && '' !== $hours ) {
			$schema['openingHours'] = $hours;
		}

		$service_area = get_option( 'goqw_business_service_area' );
		if ( is_string( $service_area ) && '' !== $service_area ) {
			$schema['areaServed'] = $service_area;
		}

		$schema['image'] = SEORouteContent::get_og_image_url();

		$price_range = get_option( 'goqw_business_price_range' );
		if ( is_string( $price_range ) && '' !== $price_range ) {
			$schema['priceRange'] = $price_range;
		}

		$same_as = self::get_social_links();
		if ( ! empty( $same_as ) ) {
			$schema['sameAs'] = $same_as;
		}

		return $schema;
	}

	/**
	 * Get business name from option or fall back to site name.
	 */
	private static function get_business_name(): string {
		$name = get_option( 'goqw_business_name' );
		if ( is_string( $name ) && '' !== $name ) {
			return $name;
		}
		return get_bloginfo( 'name' );
	}

	/**
	 * Build address PostalAddress sub-schema from goqw_business_address.
	 *
	 * Checks goqw_business_address_structured first (JSON override for precise
	 * address fields). Falls back to parsing the multi-line
	 * goqw_business_address string with a line-heuristic:
	 *   line 0 = streetAddress
	 *   line 1 (if 3+ lines) = addressLocality
	 *   last line = postalCode
	 *   addressCountry defaults to 'GB'.
	 *
	 * @return array<string, string>|null PostalAddress sub-schema, or null
	 *                                    when no address option is set.
	 */
	private static function build_address_schema(): ?array {
		$structured = get_option( 'goqw_business_address_structured' );
		if ( is_string( $structured ) && '' !== $structured ) {
			$decoded = json_decode( $structured, true );
			if ( is_array( $decoded ) ) {
				return array_merge( array( '@type' => 'PostalAddress' ), $decoded );
			}
		}

		$address_string = get_option( 'goqw_business_address' );
		if ( ! is_string( $address_string ) || '' === $address_string ) {
			return null;
		}

		$lines = array_values(
			array_filter( array_map( 'trim', explode( "\n", $address_string ) ) )
		);

		if ( empty( $lines ) ) {
			return null;
		}

		$count  = count( $lines );
		$schema = array( '@type' => 'PostalAddress' );

		$schema['streetAddress'] = $lines[0];

		if ( $count >= 3 ) {
			$schema['addressLocality'] = $lines[1];
		}

		if ( $count >= 2 ) {
			$schema['postalCode'] = $lines[ $count - 1 ];
		}

		$schema['addressCountry'] = 'GB';

		return $schema;
	}

	/**
	 * Get social media URLs as an array for the sameAs property.
	 *
	 * Reads from discrete goqw_social_* options. Returns only non-empty entries.
	 *
	 * @return string[]
	 */
	private static function get_social_links(): array {
		$platforms = array(
			'goqw_social_facebook',
			'goqw_social_instagram',
			'goqw_social_twitter',
			'goqw_social_linkedin',
		);

		$urls = array();
		foreach ( $platforms as $option_key ) {
			$value = get_option( $option_key );
			if ( is_string( $value ) && '' !== $value ) {
				$urls[] = $value;
			}
		}

		return $urls;
	}
}
