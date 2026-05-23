<?php
/**
 * Plugin Name: GOQW Diagnostic Probe (TEMPORARY)
 * Description: Step 3F diagnostics. Logs the page render lifecycle. DELETE after use.
 * Version: 0.0.1
 *
 * Drop this file into wp-content/plugins/goqw-diag.php and activate it.
 * It does NOT touch the quote-wizard plugin.
 */

defined( 'ABSPATH' ) || exit;

// 1. Did the_content run, and did it contain our shortcode?
add_filter( 'the_content', function ( $content ) {
	$has = ( false !== strpos( (string) $content, '[quote_wizard]' ) );
	error_log( '[DIAG-3F] the_content filter ran. Raw shortcode present in $content=' . ( $has ? 'YES' : 'NO' ) . '; length=' . strlen( (string) $content ) );
	return $content;
}, 1 ); // priority 1 = very early, see the raw content before other filters

// 2. After all the_content processing, did the shortcode get expanded?
add_filter( 'the_content', function ( $content ) {
	$still_raw = ( false !== strpos( (string) $content, '[quote_wizard]' ) );
	$has_mount = ( false !== strpos( (string) $content, 'qw-root' ) );
	error_log( '[DIAG-3F] the_content (priority 999) raw_shortcode_still_present=' . ( $still_raw ? 'YES' : 'NO' ) . '; mount_div_present=' . ( $has_mount ? 'YES' : 'NO' ) );
	return $content;
}, 999 ); // priority 999 = very late, after shortcodes (priority 11) ran

// 3. Is wp_enqueue_scripts firing, and is our handle registered by then?
add_action( 'wp_enqueue_scripts', function () {
	error_log( '[DIAG-3F] wp_enqueue_scripts fired. is_singular=' . ( is_singular() ? 'YES' : 'NO' ) . '; goqw-wizard registered=' . ( wp_script_is( 'goqw-wizard', 'registered' ) || wp_script_is( 'goqw-wizard', 'enqueued' ) ? 'YES' : 'NO' ) );
}, 999 );

// 4. What template is being used, and is the shortcode registered globally?
add_action( 'wp_footer', function () {
	global $template;
	error_log( '[DIAG-3F] wp_footer. template=' . ( is_string( $template ) ? basename( $template ) : 'unknown' ) . '; shortcode_exists(quote_wizard)=' . ( shortcode_exists( 'quote_wizard' ) ? 'YES' : 'NO' ) . '; goqw-wizard enqueued=' . ( wp_script_is( 'goqw-wizard', 'enqueued' ) ? 'YES' : 'NO' ) );
}, 999 );
