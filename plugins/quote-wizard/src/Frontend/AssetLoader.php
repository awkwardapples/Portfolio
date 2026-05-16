<?php
/**
 * Frontend asset enqueueing.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

use Agency\QuoteWizard\Support\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Enqueues the built React bundle and CSS on pages containing the shortcode.
 *
 * Step 3E responsibilities:
 *   - Detect shortcode presence on the current page.
 *   - Resolve hashed filenames via ManifestReader.
 *   - Enqueue JS + CSS using WordPress's standard APIs.
 *   - Inject window.GOQW_CONFIG via wp_add_inline_script before the bundle runs.
 *   - Inject --goqw-primary CSS variable as an inline style before the CSS.
 *   - Surface a clear admin notice if the manifest is missing or invalid.
 *
 * Behaviour when manifest is unavailable:
 *   - Visitors with manage_options capability: admin notice near mount point.
 *   - Other visitors: no notice (graceful degradation); mount div remains empty.
 *   - Both cases: warning logged via Logger.
 */
final class AssetLoader {

	/**
	 * Script handle. Used in dependency declarations and dequeue logic.
	 */
	public const SCRIPT_HANDLE = 'goqw-wizard';

	/**
	 * Style handle.
	 */
	public const STYLE_HANDLE = 'goqw-wizard';

	/**
	 * Tracks whether the build is in a usable state for the current request.
	 * Set during maybe_enqueue; consulted by Shortcode::render() to decide
	 * whether to emit an admin-visible warning.
	 *
	 * Possible values:
	 *   - 'ready'         enqueue succeeded
	 *   - 'missing'       manifest or referenced asset missing
	 *   - 'not-applicable' shortcode not on this page; no decision needed
	 *
	 * @var string
	 */
	private static string $build_state = 'not-applicable';

	/**
	 * Conditionally enqueue wizard assets.
	 *
	 * Hooked to wp_enqueue_scripts in Plugin::boot(). Runs on every front-end
	 * page load. Cheap when the shortcode isn't present.
	 */
	public static function maybe_enqueue(): void {
		if ( ! self::current_page_has_shortcode() ) {
			return;
		}

		$manifest = ManifestReader::read();

		if ( null === $manifest ) {
			self::$build_state = 'missing';
			Logger::warning( 'Wizard build assets unavailable; shortcode will degrade gracefully' );
			return;
		}

		self::enqueue_assets( $manifest );
		self::$build_state = 'ready';
	}

	/**
	 * Whether enqueueing for this request resolved successfully.
	 *
	 * Used by Shortcode::render to decide whether to emit an admin-visible
	 * warning alongside the mount div.
	 */
	public static function build_state(): string {
		return self::$build_state;
	}

	/**
	 * Perform the actual enqueue + inline injection.
	 *
	 * @param array{js: string, css: string} $manifest Resolved manifest entries.
	 */
	private static function enqueue_assets( array $manifest ): void {
		$js_url  = ManifestReader::asset_url( $manifest['js'] );
		$css_url = ManifestReader::asset_url( $manifest['css'] );

		// CSS: enqueue first so the inline style block can hook to it.
		wp_enqueue_style(
			self::STYLE_HANDLE,
			$css_url,
			array(),
			GOQW_VERSION
		);

		// Inject the brand colour CSS variable before the stylesheet runs.
		// Use rgb(R G B) format so Tailwind's <alpha-value> token resolves.
		$primary_rgb = self::hex_to_rgb_triplet( PublicConfig::build()['primaryColor'] );
		wp_add_inline_style(
			self::STYLE_HANDLE,
			':root { --goqw-primary: ' . esc_attr( $primary_rgb ) . '; }'
		);

		// JS: enqueue in footer with type=module so Vite's ES bundle works.
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

		// Mark the script as a module — Vite emits ESM.
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

		// Inject window.GOQW_CONFIG BEFORE the bundle script runs.
		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.GOQW_CONFIG = ' . PublicConfig::to_inline_json() . ';',
			'before'
		);
	}

	/**
	 * Does the current request render a page whose content includes the shortcode?
	 *
	 * Conservative check: only "yes" when WordPress has set up the main query
	 * with a $post that contains the shortcode in its content. Archive pages,
	 * widget contexts, and template parts are out of scope for v1.
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
	 * Convert "#RRGGBB" to "R G B" triplet (Tailwind alpha-value compatible).
	 *
	 * Falls back to the brand default if input is malformed.
	 *
	 * @param string $hex Hex colour string, e.g. "#0F4C81".
	 */
	private static function hex_to_rgb_triplet( string $hex ): string {
		$hex = ltrim( $hex, '#' );

		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}

		if ( 6 !== strlen( $hex ) || ! ctype_xdigit( $hex ) ) {
			// Malformed; fall back to the project default (#0F4C81).
			return '15 76 129';
		}

		return (string) hexdec( substr( $hex, 0, 2 ) )
			. ' ' . hexdec( substr( $hex, 2, 2 ) )
			. ' ' . hexdec( substr( $hex, 4, 2 ) );
	}

	/**
	 * Ensure the script tag has type="module". WordPress's default emit
	 * is type="text/javascript"; we replace it (or insert it) for our handle.
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
}
