<?php
/**
 * REST controller for wizard submissions.
 *
 * STUB FOR STEP 3D — real handler lands in Step 5.1.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Rest;

use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

defined( 'ABSPATH' ) || exit;

/**
 * POST /wp-json/qw/v1/submit
 *
 * In Step 5.1 this will:
 *   1. Verify the WordPress nonce.
 *   2. Apply per-IP rate limiting via RateLimiter.
 *   3. Validate the payload via Validator (mirrors the React-side Zod schemas).
 *   4. Sanitise every input via Sanitiser.
 *   5. Sideload uploaded images into the WP media library via ImageHandler.
 *   6. Persist the submission to goqw_submissions via Repository.
 *   7. Forward the payload to Make.com via MakeForwarder.
 *   8. Return 200 on full success, 502 on forwarder failure (per ADR-0005).
 *
 * Until then, the route is registered but returns 501 Not Implemented so any
 * accidental request gets a clear error rather than a misleading 404.
 */
final class SubmitController {

	private const NAMESPACE = 'qw/v1';
	private const ROUTE     = '/submit';

	/**
	 * Register REST routes. Hooked to rest_api_init in Plugin::boot().
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			self::ROUTE,
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( self::class, 'handle_submit' ),
				// Permission callback returns true because the endpoint is
				// public by design (homeowners aren't logged in). Real abuse
				// protection comes from nonce + rate limiting + Validator,
				// added in Step 5.1.
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Handle a submission request.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 */
	public static function handle_submit( WP_REST_Request $request ): WP_REST_Response {
		unset( $request );

		return new WP_REST_Response(
			array(
				'ok'    => false,
				'error' => 'not_implemented',
				'note'  => 'Submission endpoint is registered but not yet implemented (Step 5.1).',
			),
			501
		);
	}
}
