<?php
/**
 * Namespace prefix defense tests for Activator (Step 5.14.1).
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

it(
	'every WordPress function call in Activator.php is backslash-prefixed',
	function (): void {
		$source = (string) file_get_contents( __DIR__ . '/../../src/Activator.php' );

		assert_wp_calls_are_prefixed(
			$source,
			[
				'add_option',
				'get_option',
				'wp_next_scheduled',
				'wp_schedule_event',
				'wp_upload_dir',
				'wp_mkdir_p',
				'flush_rewrite_rules',
			]
		);
	}
);

it(
	'Activator.php does not prefix its own call to SitemapGenerator::add_rewrite_rule()',
	function (): void {
		$source = (string) file_get_contents( __DIR__ . '/../../src/Activator.php' );

		expect( $source )->toContain( 'SitemapGenerator::add_rewrite_rule();' );
		expect( $source )->not->toContain( '\SitemapGenerator::add_rewrite_rule();' );
		expect( $source )->not->toContain( 'SitemapGenerator::\add_rewrite_rule();' );
	}
);
