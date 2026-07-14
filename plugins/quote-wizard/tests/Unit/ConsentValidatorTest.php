<?php
/**
 * Unit tests for ConsentValidator.
 *
 * @package Agency\QuoteWizard
 */

declare( strict_types=1 );

use Agency\QuoteWizard\Submissions\ConsentValidator;

it( 'accepts consent when the field holds the expected checked value', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given( array( 'data_processing_consent' => array( 'agreed' ) ) );

	expect( $result )->toBeTrue();
} );

it( 'accepts consent alongside other unrelated answers', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given(
		array(
			'contact_email'             => 'jane@example.com',
			'data_processing_consent'   => array( 'agreed' ),
		)
	);

	expect( $result )->toBeTrue();
} );

it( 'rejects a missing consent field', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given( array( 'contact_email' => 'jane@example.com' ) );

	expect( $result )->toBeFalse();
} );

it( 'rejects an empty array (checkbox unchecked)', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given( array( 'data_processing_consent' => array() ) );

	expect( $result )->toBeFalse();
} );

it( 'rejects a non-array value even if truthy', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given( array( 'data_processing_consent' => true ) );

	expect( $result )->toBeFalse();
} );

it( 'rejects an array that does not contain the expected value', function (): void {
	$validator = new ConsentValidator();

	$result = $validator->is_given( array( 'data_processing_consent' => array( 'something_else' ) ) );

	expect( $result )->toBeFalse();
} );
