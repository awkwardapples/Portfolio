<?php
/**
 * Unit tests for ServiceSchemaEmitter.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\ServiceSchemaEmitter;
use Brain\Monkey;
use Brain\Monkey\Functions;

beforeEach(
	function (): void {
		Monkey\setUp();
	}
);

afterEach(
	function (): void {
		Monkey\tearDown();
		unset( $_SERVER['REQUEST_URI'] );
	}
);

it( 'does not emit on a non-React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );

	$_SERVER['REQUEST_URI'] = '/wp-admin/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( trim( $output ) )->toBe( '' );
} );

it( 'returns all 12 services when goqw_enabled_services is empty', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			return 'goqw_enabled_services' === $key ? '' : ( false !== $fallback ? $fallback : '' );
		}
	);

	$services = ServiceSchemaEmitter::get_active_services();

	expect( $services )->toHaveCount( 12 );
	expect( $services )->toHaveKey( 'fencing' );
	expect( $services )->toHaveKey( 'general-repairs' );
	expect( $services )->toHaveKey( 'carpentry' );
	expect( $services )->toHaveKey( 'other' );
} );

it( 'returns only enabled services when goqw_enabled_services is set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			return 'goqw_enabled_services' === $key ? 'fencing,decking' : ( false !== $fallback ? $fallback : '' );
		}
	);

	$services = ServiceSchemaEmitter::get_active_services();

	expect( $services )->toHaveCount( 2 );
	expect( $services )->toHaveKey( 'fencing' );
	expect( $services )->toHaveKey( 'decking' );
	expect( $services )->not->toHaveKey( 'painting' );
} );

it( 'each service schema includes provider reference', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			if ( 'goqw_enabled_services' === $key ) {
				return 'fencing';
			}
			if ( 'goqw_business_name' === $key ) {
				return 'Acme Fencing';
			}
			return false !== $fallback ? $fallback : '';
		}
	);
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'LocalBusiness' );
	expect( $output )->toContain( 'provider' );
	expect( $output )->toContain( 'Acme Fencing' );
} );

it( 'each service schema includes category label', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			if ( 'goqw_enabled_services' === $key ) {
				return 'fencing';
			}
			return false !== $fallback ? $fallback : '';
		}
	);
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'Landscaping' );
} );

it( 'omits the category field for the deliberately uncategorized "other" service (6.3)', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			if ( 'goqw_enabled_services' === $key ) {
				return 'other';
			}
			return false !== $fallback ? $fallback : '';
		}
	);
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'Other services' );
	expect( $output )->not->toContain( '"category"' );
} );

it( 'includes areaServed in each schema when goqw_business_service_area is set', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			if ( 'goqw_enabled_services' === $key ) {
				return 'fencing';
			}
			if ( 'goqw_business_service_area' === $key ) {
				return 'Surrey and surrounding areas';
			}
			return false !== $fallback ? $fallback : '';
		}
	);
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'areaServed' );
	expect( $output )->toContain( 'Surrey and surrounding areas' );
} );

it( 'emits nothing when no services match the enabled list', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->alias(
		static function ( string $key, mixed $fallback = false ): mixed {
			return 'goqw_enabled_services' === $key ? 'nonexistent-service' : ( false !== $fallback ? $fallback : '' );
		}
	);
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	ServiceSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( trim( $output ) )->toBe( '' );
} );
