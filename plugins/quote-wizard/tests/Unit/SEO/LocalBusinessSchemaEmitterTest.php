<?php
/**
 * Unit tests for LocalBusinessSchemaEmitter.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\SEO\LocalBusinessSchemaEmitter;
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

it( 'emits LocalBusiness JSON-LD on a React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Acme Fencing' );

	$_SERVER['REQUEST_URI'] = '/';

	ob_start();
	LocalBusinessSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( $output )->toContain( 'application/ld+json' );
	expect( $output )->toContain( 'LocalBusiness' );
	expect( $output )->toContain( 'schema.org' );
} );

it( 'does not emit on a non-React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );

	$_SERVER['REQUEST_URI'] = '/wp-login.php';

	ob_start();
	LocalBusinessSchemaEmitter::emit();
	$output = ob_get_clean();

	expect( trim( $output ) )->toBe( '' );
} );

it( 'uses business name from goqw_business_name option', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			return 'goqw_business_name' === $key ? "Scott's Building Services" : '';
		}
	);
	Functions\when( 'home_url' )->returnArg();

	$schema = LocalBusinessSchemaEmitter::build_schema();

	expect( $schema['name'] )->toBe( "Scott's Building Services" );
} );

it( 'falls back to site name when goqw_business_name is empty', function (): void {
	Functions\when( 'get_option' )->justReturn( '' );
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'My WordPress Site' );

	$schema = LocalBusinessSchemaEmitter::build_schema();

	expect( $schema['name'] )->toBe( 'My WordPress Site' );
} );

it( 'includes telephone when goqw_business_phone is set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			return 'goqw_business_phone' === $key ? '01234 567 890' : '';
		}
	);
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$schema = LocalBusinessSchemaEmitter::build_schema();

	expect( $schema )->toHaveKey( 'telephone' );
	expect( $schema['telephone'] )->toBe( '01234 567 890' );
} );

it( 'includes PostalAddress sub-schema when goqw_business_address is set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			if ( 'goqw_business_address' === $key ) {
				return "1 High Street\nGuildford\nGU1 3SX";
			}
			return '';
		}
	);
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$schema = LocalBusinessSchemaEmitter::build_schema();

	expect( $schema )->toHaveKey( 'address' );
	expect( $schema['address']['@type'] )->toBe( 'PostalAddress' );
	expect( $schema['address']['streetAddress'] )->toBe( '1 High Street' );
	expect( $schema['address']['addressLocality'] )->toBe( 'Guildford' );
	expect( $schema['address']['postalCode'] )->toBe( 'GU1 3SX' );
	expect( $schema['address']['addressCountry'] )->toBe( 'GB' );
} );

it( 'includes sameAs array when social options are set', function (): void {
	Functions\when( 'get_option' )->alias(
		static function ( string $key ): string {
			$social = array(
				'goqw_social_facebook'  => 'https://facebook.com/test',
				'goqw_social_instagram' => 'https://instagram.com/test',
			);
			return $social[ $key ] ?? '';
		}
	);
	Functions\when( 'home_url' )->returnArg();
	Functions\when( 'get_bloginfo' )->justReturn( 'Test Site' );

	$schema = LocalBusinessSchemaEmitter::build_schema();

	expect( $schema )->toHaveKey( 'sameAs' );
	expect( $schema['sameAs'] )->toContain( 'https://facebook.com/test' );
	expect( $schema['sameAs'] )->toContain( 'https://instagram.com/test' );
} );
