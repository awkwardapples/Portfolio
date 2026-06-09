<?php
/**
 * Minimal page template for React-hosted routes.
 *
 * Renders just enough HTML for the React bundle to mount. Theme header and
 * footer are intentionally bypassed; wp_head() and wp_footer() are called to
 * preserve plugin compatibility (admin bar, SEO, analytics, security plugins).
 *
 * See ADR-0019 for architectural rationale.
 *
 * @package Agency\QuoteWizard
 */

defined( 'ABSPATH' ) || exit;
?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo( 'charset' ); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php bloginfo( 'name' ); ?></title>
  <link rel="profile" href="https://gmpg.org/xfn/11">
  <?php wp_head(); ?>
</head>
<body <?php body_class( 'goqw-react-host' ); ?>>
  <?php wp_body_open(); ?>
  <div id="qw-root"></div>
  <?php wp_footer(); ?>
</body>
</html>
