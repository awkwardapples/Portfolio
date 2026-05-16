<?php
/**
 * Vite manifest reader.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

namespace Agency\QuoteWizard\Frontend;

use Agency\QuoteWizard\Support\Logger;

defined( 'ABSPATH' ) || exit;

/**
 * Reads and validates the Vite build manifest at `assets/dist/manifest.json`.
 *
 * The manifest is the contract between the React build pipeline and the
 * WordPress enqueue layer. We do not hardcode filenames in PHP — Vite emits
 * content-hashed filenames for cache-busting and writes the current names
 * to the manifest. This class is the only place that decodes that contract.
 *
 * Fail-closed behaviour: every validation step that fails returns null and
 * logs the specific reason. Callers (AssetLoader) treat null as "do not
 * enqueue; surface an admin notice".
 */
final class ManifestReader {

	/**
	 * The shape we expect after reading. All paths are RELATIVE to assets/dist/.
	 *
	 * @var array{js: string, css: string}|null
	 */
	private static ?array $cached = null;

	/**
	 * Reset the in-memory cache. Used by tests; not exposed to production paths.
	 */
	public static function reset_cache(): void {
		self::$cached = null;
	}

	/**
	 * Read the manifest and return the JS + CSS filenames.
	 *
	 * @return array{js: string, css: string}|null Filenames relative to assets/dist/,
	 *         or null if the manifest is missing, malformed, or references files
	 *         that do not exist on disk.
	 */
	public static function read(): ?array {
		if ( null !== self::$cached ) {
			return self::$cached;
		}

		$manifest_path = self::manifest_path();

		if ( ! is_readable( $manifest_path ) ) {
			Logger::warning( 'Vite manifest not readable', array( 'path' => $manifest_path ) );
			return null;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$raw = file_get_contents( $manifest_path );
		if ( false === $raw || '' === $raw ) {
			Logger::warning( 'Vite manifest empty or unreadable', array( 'path' => $manifest_path ) );
			return null;
		}

		$decoded = json_decode( $raw, true );
		if ( ! is_array( $decoded ) ) {
			Logger::warning(
				'Vite manifest is not valid JSON',
				array(
					'path'  => $manifest_path,
					'error' => json_last_error_msg(),
				)
			);
			return null;
		}

		$js_relative = self::extract_string( $decoded, 'src/main.tsx', 'file' );
		if ( null === $js_relative ) {
			Logger::warning(
				'Vite manifest missing entry "src/main.tsx" or its "file" key',
				array( 'path' => $manifest_path )
			);
			return null;
		}

		$css_relative = self::extract_string( $decoded, 'style.css', 'file' );
		if ( null === $css_relative ) {
			Logger::warning(
				'Vite manifest missing entry "style.css" or its "file" key',
				array( 'path' => $manifest_path )
			);
			return null;
		}

		// Sanity-check that the referenced files actually exist on disk.
		$dist_dir = self::dist_dir();
		if ( ! is_readable( $dist_dir . $js_relative ) ) {
			Logger::warning(
				'Vite manifest references missing JS file',
				array( 'file' => $dist_dir . $js_relative )
			);
			return null;
		}
		if ( ! is_readable( $dist_dir . $css_relative ) ) {
			Logger::warning(
				'Vite manifest references missing CSS file',
				array( 'file' => $dist_dir . $css_relative )
			);
			return null;
		}

		self::$cached = array(
			'js'  => $js_relative,
			'css' => $css_relative,
		);

		return self::$cached;
	}

	/**
	 * Resolve a relative dist filename to its public URL.
	 *
	 * @param string $relative Filename relative to assets/dist/.
	 */
	public static function asset_url( string $relative ): string {
		return GOQW_PLUGIN_URL . 'assets/dist/' . ltrim( $relative, '/' );
	}

	/**
	 * Absolute filesystem path to the manifest.
	 */
	public static function manifest_path(): string {
		return self::dist_dir() . 'manifest.json';
	}

	/**
	 * Absolute filesystem path to the dist directory (with trailing slash).
	 */
	private static function dist_dir(): string {
		return GOQW_PLUGIN_DIR . 'assets/dist/';
	}

	/**
	 * Defensive extraction: $decoded[$entry][$key] must be a non-empty string.
	 *
	 * @param array<string, mixed> $decoded The decoded JSON.
	 * @param string               $entry   Top-level entry to look up.
	 * @param string               $key     Sub-key to extract.
	 */
	private static function extract_string( array $decoded, string $entry, string $key ): ?string {
		if ( ! isset( $decoded[ $entry ] ) || ! is_array( $decoded[ $entry ] ) ) {
			return null;
		}
		if ( ! isset( $decoded[ $entry ][ $key ] ) || ! is_string( $decoded[ $entry ][ $key ] ) ) {
			return null;
		}
		$value = $decoded[ $entry ][ $key ];
		if ( '' === $value ) {
			return null;
		}
		return $value;
	}
}
