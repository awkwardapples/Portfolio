<?php
/**
 * Frontend asset enqueueing.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

use Agency\QuoteWizard\Routing\SiteRoutes;
use Agency\QuoteWizard\Support\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueues the built React bundle and CSS on pages containing the shortcode.
 */
final class AssetLoader {

	/**
	 * Script handle.
	 */
	public const SCRIPT_HANDLE = 'goqw-wizard';

	/**
	 * Style handle.
	 */
	public const STYLE_HANDLE = 'goqw-wizard';

	/**
	 * Tracks whether the build is in a usable state.
	 *
	 * @var string
	 */
	private static string $build_state = 'not-applicable';

	/**
	 * Guards ensure_enqueued() so the work runs at most once per request.
	 *
	 * @var bool
	 */
	private static bool $enqueue_attempted = false;

	/**
	 * Fast-path enqueue: triggers on React routes and on shortcode-containing pages.
	 */
	public static function maybe_enqueue(): void {
		if ( ! self::should_enqueue_for_request() ) {
			return;
		}

		self::ensure_enqueued();
	}

	/**
	 * Should assets be enqueued for the current request?
	 *
	 * Returns true when the request is a recognized React route (covers the
	 * minimal template path where the_content() is never called and shortcodes
	 * are never evaluated) OR when the page content contains the shortcode
	 * (classic-template embedded usage).
	 */
	private static function should_enqueue_for_request(): bool {
		return SiteRoutes::is_current_request_react_route() || self::current_page_has_shortcode();
	}

	/**
	 * Idempotently resolve the manifest and enqueue assets.
	 */
	public static function ensure_enqueued(): void {
		if ( self::$enqueue_attempted ) {
			return;
		}

		self::$enqueue_attempted = true;

		$manifest = ManifestReader::read();

		if ( null === $manifest ) {
			self::$build_state = 'missing';
			Logger::operational( 'Wizard build assets unavailable on page request; shortcode degraded.' );
			Logger::warning( 'Wizard build assets unavailable; shortcode will degrade gracefully.' );
			return;
		}

		self::enqueue_assets( $manifest );
		self::$build_state = 'ready';
	}

	/**
	 * Whether enqueueing for this request resolved successfully.
	 */
	public static function build_state(): string {
		return self::$build_state;
	}

	/**
	 * Does the current request render a page whose content includes the shortcode?
	 */
	private static function current_page_has_shortcode(): bool {
		if ( ! is_singular() ) {
			return false;
		}

		$post = get_post();

		if ( ! ( $post instanceof \WP_Post ) ) {
			return false;
		}

		return has_shortcode( $post->post_content, Shortcode::TAG );
	}

	/**
	 * Perform the actual enqueue + inline injection.
	 *
	 * @param array{js: string, css: string} $manifest Resolved manifest entries.
	 */
	private static function enqueue_assets( array $manifest ): void {
		$js_url  = ManifestReader::asset_url( $manifest['js'] );
		$css_url = ManifestReader::asset_url( $manifest['css'] );

		// CSS first.
		wp_enqueue_style(
			self::STYLE_HANDLE,
			$css_url,
			array(),
			GOQW_VERSION
		);

		// Inject primary color CSS variable.
		$primary_rgb = self::hex_to_rgb_triplet( PublicConfig::build()['primaryColor'] );
		wp_add_inline_style(
			self::STYLE_HANDLE,
			':root { --goqw-primary: ' . esc_attr( $primary_rgb ) . '; }'
		);

		// JS in footer as module.
		wp_enqueue_script(
			self::SCRIPT_HANDLE,
			$js_url,
			array(),
			GOQW_VERSION,
			array(
				'in_footer' => true,
				'strategy'  => 'defer',
			)
		);

		// Make script a module.
		add_filter(
			'script_loader_tag',
			static function ( string $tag, string $handle ): string {
				if ( self::SCRIPT_HANDLE !== $handle ) {
					return $tag;
				}
				return self::ensure_module_attribute( $tag );
			},
			10,
			2
		);

		// Inject config before the bundle.
		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.GOQW_CONFIG = ' . PublicConfig::to_inline_json() . ';',
			'before'
		);
	}

	/**
	 * Convert hex to RGB triplet for Tailwind.
	 *
	 * @param string $hex Hex colour string, e.g. "#0F4C81".
	 */
	private static function hex_to_rgb_triplet( string $hex ): string {
		$hex = ltrim( $hex, '#' );

		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		if ( 6 !== strlen( $hex ) || ! ctype_xdigit( $hex ) ) {
			return '15 76 129';
		}

		return (string) hexdec( substr( $hex, 0, 2 ) )
			. ' ' . hexdec( substr( $hex, 2, 2 ) )
			. ' ' . hexdec( substr( $hex, 4, 2 ) );
	}

	/**
	 * Ensure script has type="module".
	 *
	 * @param string $tag The original <script> tag.
	 */
	private static function ensure_module_attribute( string $tag ): string {
		if ( str_contains( $tag, ' type=' ) ) {
			$tag = (string) preg_replace(
				'/\s+type=(["\'])[^"\']*\1/i',
				' type="module"',
				$tag
			);
		} else {
			$tag = str_replace( '<script ', '<script type="module" ', $tag );
		}

		return $tag;
	}

	/**
	 * Render admin notice when build assets are missing.
	 */
	public static function render_admin_notice(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( null !== ManifestReader::read() ) {
			return; // Assets are present.
		}

		printf(
			'<div class="notice notice-error"><p><strong>%1$s</strong> %2$s</p><p>%3$s</p></div>',
			esc_html__( 'Quote Wizard:', 'quote-wizard' ),
			esc_html__( 'compiled React assets are missing or unreadable.', 'quote-wizard' ),
			esc_html__( 'Run "pnpm build-plugin" from the project root to rebuild.', 'quote-wizard' )
		);
	}
}
