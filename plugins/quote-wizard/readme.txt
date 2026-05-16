=== Quote Wizard ===
Contributors: agency
Tags: quote, leads, wizard, trades, automation
Requires at least: 6.4
Tested up to: 6.7
Requires PHP: 8.1
Stable tag: 0.1.0
License: Proprietary

Embeds a configurable React quote wizard into WordPress and routes submissions to Make.com for downstream automation.

== Description ==

Quote Wizard is a private, agency-deployed plugin that adds an embedded multi-step quote wizard to a WordPress site. Submissions are captured into a local database table and forwarded to Make.com for HubSpot integration, owner notification, and customer confirmation.

This plugin is part of a wider deployment framework and is not distributed publicly.

== Installation ==

1. Upload the plugin ZIP via wp-admin > Plugins > Add New > Upload.
2. Activate the plugin.
3. Configure Settings via wp-admin > Settings > Quote Wizard (available from v0.3.0).
4. Add the `[quote_wizard]` shortcode to any page.

== Changelog ==

= 0.1.0 =
Initial scaffold release. Shortcode renders mount point; submission endpoint registered but returns 501 (full handler in v0.3.0).
