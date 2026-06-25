# Phase 0 Audit — Footer-Content Options (Step 5.10b)

Audit performed prior to LocalBusinessSchemaEmitter implementation.

## Key finding

Footer content is stored as a TypeScript constant in
`apps/wizard/src/site/pages/footer-content.ts`. It is NOT stored in
`wp_options`. There is no `goqw_footer_content` JSON blob.

## Existing goqw*business*\* WP options (seeded by Activator)

These already exist in `wp_options` after plugin activation:

| Option key            | Seeded default     | Source                             |
| --------------------- | ------------------ | ---------------------------------- |
| `goqw_business_name`  | From `blogname`    | `Activator::set_default_options()` |
| `goqw_business_phone` | `''` (empty)       | `Activator::set_default_options()` |
| `goqw_business_email` | From `admin_email` | `Activator::set_default_options()` |

## New options required for Layer 2 (LocalBusiness schema)

These do not yet exist. `Activator::set_default_options()` must be extended:

| Option key                   | Default value | Purpose                    |
| ---------------------------- | ------------- | -------------------------- |
| `goqw_business_address`      | `''`          | Multi-line street address  |
| `goqw_business_hours`        | `''`          | Opening hours (free text)  |
| `goqw_business_service_area` | `''`          | Service area (free text)   |
| `goqw_business_price_range`  | `''`          | Price range (e.g., `'££'`) |
| `goqw_social_facebook`       | `''`          | Facebook page URL          |
| `goqw_social_instagram`      | `''`          | Instagram profile URL      |
| `goqw_social_twitter`        | `''`          | Twitter/X profile URL      |
| `goqw_social_linkedin`       | `''`          | LinkedIn company URL       |

## LocalBusinessSchemaEmitter implementation approach

Because footer data is TypeScript-only, `LocalBusinessSchemaEmitter` reads
directly from the `goqw_business_*` and `goqw_social_*` WP options. No JSON
parsing needed.

For address parsing: `goqw_business_address` is a multi-line string. The
emitter parses it into a PostalAddress sub-schema with a simple heuristic
(first line = streetAddress, middle = locality, last = postalCode,
addressCountry defaults to `'GB'`). A `goqw_business_address_structured`
override option (JSON blob) allows precise control when the heuristic is
insufficient.

## Example per-client setup

```bash
wp option update goqw_business_name "Scott's Building Services"
wp option update goqw_business_phone "01234 567 890"
wp option update goqw_business_email "hello@scottsbuilding.co.uk"
wp option update goqw_business_address "1 High Street\nGuildford\nGU1 3SX"
wp option update goqw_business_hours "Mon-Fri: 8:00-18:00"
wp option update goqw_business_service_area "Surrey and surrounding areas"
wp option update goqw_business_price_range "££"
wp option update goqw_social_facebook "https://facebook.com/scottsbuilding"
wp option update goqw_social_instagram "https://instagram.com/scottsbuilding"
```
