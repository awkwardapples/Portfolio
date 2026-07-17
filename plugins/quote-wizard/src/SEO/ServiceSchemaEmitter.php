<?php
/**
 * Service JSON-LD schema emitter.
 *
 * Emits one Service schema entry per registered wizard service. Each
 * Service references the LocalBusiness as its provider.
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
 * Emits Service JSON-LD into wp_head for React-hosted routes.
 *
 * Schema source: schema.org/Service
 *
 * Fields emitted per service (T2 Option B — standard):
 *   - @type: Service
 *   - name (service display name)
 *   - description (service description)
 *   - provider (LocalBusiness reference)
 *   - areaServed (from goqw_business_service_area when set)
 *   - category (human-readable category label)
 *
 * Hooked into wp_head at priority 11 (after LocalBusinessSchemaEmitter at 10).
 * Scope-guarded to fire only on React routes.
 *
 * Service data mirrors apps/wizard/src/site/content/services-content.ts.
 * When services are added or renamed there, update SERVICES here in the
 * same commit. See SERVICE-REGISTRY-AUDIT.md for rationale.
 */
final class ServiceSchemaEmitter {

	/**
	 * Static service map mirroring services-content.ts.
	 *
	 * Descriptions are drawn from the 'description' field in services-content.ts.
	 * Category IDs match verticals.ts categoryId values.
	 *
	 * @var array<string, array{name: string, description: string, category: string}>
	 */
	private const SERVICES = array(
		'fencing'         => array(
			'name'        => 'Fencing',
			'description' => 'We install closeboard, feather edge, panel, and post-and-rail fencing. Heights from low decorative up to security boundary fencing.',
			'category'    => 'landscaping',
		),
		'decking'         => array(
			'name'        => 'Decking',
			'description' => 'Garden decking from small balcony platforms to large entertaining spaces. We work in softwood, hardwood, and modern composite materials.',
			'category'    => 'landscaping',
		),
		'patio'           => array(
			'name'        => 'Patio & Paving',
			'description' => 'Natural stone, Indian sandstone, and concrete slab patios. Full preparation including sub-base, edging, and drainage.',
			'category'    => 'landscaping',
		),
		'driveway'        => array(
			'name'        => 'Driveway',
			'description' => 'Block paving driveways in a range of materials. Includes full excavation, sub-base preparation, kerb edging, and drainage.',
			'category'    => 'landscaping',
		),
		'steps'           => array(
			'name'        => 'Garden Steps',
			'description' => 'Garden and entrance steps in brick, slate, Portland stone, cast stone, or granite. Straight and curved designs.',
			'category'    => 'landscaping',
		),
		'painting'        => array(
			'name'        => 'Painting & Decorating',
			'description' => 'Walls, ceilings, skirting boards, doors, and window frames. Water-based and oil-based finishes.',
			'category'    => 'decorating',
		),
		'jetwash'         => array(
			'name'        => 'Pressure Washing',
			'description' => 'Professional pressure washing for patios, driveways, paths, steps, and timber decking. Priced per square metre.',
			'category'    => 'exterior-cleaning',
		),
		'general-repairs' => array(
			'name'        => 'General Repairs',
			'description' => 'General handyman repairs and maintenance — from fixing doors and gates to garden furniture and minor building work.',
			'category'    => 'handyman',
		),
		'plumbing'        => array(
			'name'        => 'Plumbing',
			'description' => 'Plumbing repairs and installations including leaks, blocked drains, new fittings, and boiler services.',
			'category'    => 'handyman',
		),
		'electrical'      => array(
			'name'        => 'Electrical',
			'description' => 'Electrical work including new lighting, socket installation, fault diagnosis, and consumer unit upgrades.',
			'category'    => 'handyman',
		),
		'carpentry'       => array(
			'name'        => 'Carpentry',
			'description' => 'Carpentry and joinery including shelving, furniture assembly, internal doors, and bespoke builds.',
			'category'    => 'handyman',
		),
	);

	/**
	 * Category ID to display name map.
	 *
	 * @var array<string, string>
	 */
	private const CATEGORY_LABELS = array(
		'landscaping'       => 'Landscaping',
		'decorating'        => 'Decorating',
		'exterior-cleaning' => 'Exterior Cleaning',
		'handyman'          => 'Handyman Services',
	);

	/**
	 * Register the wp_head hook.
	 */
	public static function register(): void {
		\add_action( 'wp_head', array( __CLASS__, 'emit' ), 11 );
	}

	/**
	 * Emit one Service JSON-LD block per active registered service.
	 */
	public static function emit(): void {
		if ( ! SiteRoutes::is_current_request_react_route() ) {
			return;
		}

		$services = self::get_active_services();
		if ( empty( $services ) ) {
			return;
		}

		$business_name = self::get_business_name();
		$service_area  = \get_option( 'goqw_business_service_area' );
		$service_area  = is_string( $service_area ) && '' !== $service_area ? $service_area : null;

		foreach ( $services as $id => $service ) {
			$schema = self::build_service_schema( $service, $business_name, $service_area );

			echo "\n<script type=\"application/ld+json\">\n";
			// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
			echo \wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT );
			echo "\n</script>\n";
		}
	}

	/**
	 * Get the services to include in schema, filtered by goqw_enabled_services.
	 *
	 * When goqw_enabled_services is empty, all 11 services are included.
	 * When set, only the listed IDs are included (same logic as listEnabledServiceIds
	 * in the TypeScript side). Unrecognized IDs are silently ignored.
	 *
	 * @return array<string, array{name: string, description: string, category: string}>
	 */
	public static function get_active_services(): array {
		$enabled_option = \get_option( 'goqw_enabled_services', '' );

		if ( ! is_string( $enabled_option ) || '' === trim( $enabled_option ) ) {
			return self::SERVICES;
		}

		$enabled_ids = array_map( 'trim', explode( ',', $enabled_option ) );
		$enabled_ids = array_filter( $enabled_ids );

		$result = array();
		foreach ( $enabled_ids as $id ) {
			if ( isset( self::SERVICES[ $id ] ) ) {
				$result[ $id ] = self::SERVICES[ $id ];
			}
		}

		return $result;
	}

	/**
	 * Build a Service schema array for a single service.
	 *
	 * @param array{name: string, description: string, category: string} $service      Service metadata.
	 * @param string                                                     $business_name Business name for provider reference.
	 * @param string|null                                                $service_area  Area served (null = omit field).
	 * @return array<string, mixed>
	 */
	private static function build_service_schema(
		array $service,
		string $business_name,
		?string $service_area
	): array {
		$schema = array(
			'@context'    => 'https://schema.org',
			'@type'       => 'Service',
			'name'        => $service['name'],
			'description' => $service['description'],
			'provider'    => array(
				'@type' => 'LocalBusiness',
				'name'  => $business_name,
			),
			'category'    => self::CATEGORY_LABELS[ $service['category'] ] ?? $service['category'],
		);

		if ( null !== $service_area ) {
			$schema['areaServed'] = $service_area;
		}

		return $schema;
	}

	/**
	 * Get business name from option or fall back to site name.
	 */
	private static function get_business_name(): string {
		$name = \get_option( 'goqw_business_name' );
		if ( is_string( $name ) && '' !== $name ) {
			return $name;
		}
		return \get_bloginfo( 'name' );
	}
}
