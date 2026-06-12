<?php
/**
 * Unit tests for AssetLoader::should_enqueue_for_request().
 *
 * Tests exercise the private guard method via ReflectionMethod to verify
 * that enqueueing fires for React routes (even without a shortcode) and
 * that the shortcode path continues to work for classic-template embeds.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Frontend\AssetLoader;
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

it( 'should_enqueue_for_request returns false for a non-React, non-shortcode page', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'is_singular' )->justReturn( false );
	$_SERVER['REQUEST_URI'] = '/not-a-route';

	$method = new \ReflectionMethod( AssetLoader::class, 'should_enqueue_for_request' );
	$method->setAccessible( true );

	expect( $method->invoke( null ) )->toBeFalse();
} );

it( 'should_enqueue_for_request returns true for a React route without a shortcode', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	$_SERVER['REQUEST_URI'] = '/quote';

	$method = new \ReflectionMethod( AssetLoader::class, 'should_enqueue_for_request' );
	$method->setAccessible( true );

	expect( $method->invoke( null ) )->toBeTrue();
} );

it( 'should_enqueue_for_request returns true when the page contains the shortcode on a non-React route', function (): void {
	Functions\when( 'is_admin' )->justReturn( false );
	Functions\when( 'is_singular' )->justReturn( true );
	Functions\when( 'has_shortcode' )->justReturn( true );
	$_SERVER['REQUEST_URI'] = '/some-other-page';

	$post               = new \WP_Post();
	$post->post_content = ''; // has_shortcode is mocked; actual content is irrelevant.
	Functions\when( 'get_post' )->justReturn( $post );

	$method = new \ReflectionMethod( AssetLoader::class, 'should_enqueue_for_request' );
	$method->setAccessible( true );

	expect( $method->invoke( null ) )->toBeTrue();
} );
