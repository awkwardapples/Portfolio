# Audit A — Current Page Creation Mechanism (5.14)

Date: 2026-07-14
Step: 5.14 Phase 0 Audit A

## Files examined

`plugins/quote-wizard/src/Activator.php`, `plugins/quote-wizard/src/Routing/SiteRootPage.php`,
`plugins/quote-wizard/src/Routing/SiteRoutes.php`, `plugins/quote-wizard/src/Routing/RouteInterceptor.php`,
`plugins/quote-wizard/src/Routing/RewriteRegistrar.php`, `plugins/quote-wizard/src/SEO/SEORouteContent.php`,
`plugins/quote-wizard/src/SEO/SitemapGenerator.php`, `apps/wizard/src/site/routing/routes.ts`,
`apps/wizard/src/site/pages/footer-content.ts`.

Note: the spec asks for this file at `src/Activator/AUDIT-5.14-page-creation.md`; there is no
`Activator/` subdirectory — `Activator.php` lives directly in `src/`, alongside `Deactivator.php`
and `Plugin.php`. Saved next to it instead, matching where `AUDIT-5.13e-cron-pattern.md` already
lives.

## Correcting the spec's central assumption

Undocumented Assumption Check #3 states: "WordPress can create pages on activation. Already done
for site-root-page-id and quote wizard page. Adding privacy policy follows same pattern." This is
**not** what `SiteRootPage` does, and applying its pattern to a second page would be wrong.

`SiteRootPage::ensure()` creates **exactly one** `wp_insert_post()` page — a single, content-less
mount point (`post_content: ''`) whose entire purpose is to give WordPress's routing machinery
(`the_content` filter, `RenderingArchitecture`) something to attach the React app's template to.
There is no "quote wizard page" as a second, separate WP page — the wizard is one of five **routes**
inside the same single-page React app, all served through that one Site Root page.

## How the site's actual multi-page content works

Every marketing "page" (Home, Services, Our work, Contact, Quote) is a client-side route, not a WP
post:

- `SiteRoutes::PATHS` (PHP) — `['/', '/services', '/our-work', '/contact', '/quote']` — must stay in
  exact sync with `apps/wizard/src/site/routing/routes.ts`'s `ROUTES` table; a Pest test
  (`CrossLanguageRoutesTest`) enforces this via regex-parsing `routes.ts`.
- `RouteInterceptor` rewrites the WP main query for any recognized path onto the single Site Root
  page ID; `RewriteRegistrar` adds the matching rewrite rule.
- `SEORouteContent::DEFAULTS` and `SitemapGenerator::ROUTE_METADATA` are separate per-route maps
  (title/description/OG data; sitemap priority/changefreq) keyed by the same path strings.
- Each route's actual content is a plain React component (e.g. `ContactPage.tsx`) that imports a
  static, plain-TypeScript content file — `site-content.ts`, `footer-content.ts`,
  `services-content.ts`, `work-content.ts`. These files are the documented, established per-client
  customization surface ("Edit this file to adapt the template for a new client" —
  `site-content.ts` header comment).

There is no database-backed content page anywhere in this architecture. Introducing one exclusively
for the privacy policy — the spec's `PrivacyPolicyPage.php` creating a `wp_insert_post()` page with
`{{BUSINESS_NAME}}`-style placeholders on activation — would be a second, inconsistent content
mechanism sitting alongside the established static-route-plus-content-file pattern, for no
functional benefit (per-client customization already has a working, documented convention here).

## A pre-existing dangling link — this is what 5.14 should fix

`footer-content.ts` already declares:

```ts
legalLinks: [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
],
```

`FooterLayout` already renders this as a real `<a>`-equivalent (`SectionLink`) in every page's
footer (`SiteShell` wraps every route, including `/quote`, in `Header` + `{children}` + `Footer`).
But `/privacy` is not in `SiteRoutes::PATHS` / `routes.ts`, so `matchRoute()` falls through to
`DEFAULT_ROUTE` (Home) per ADR-0016 ("unknown paths render the home page, not a 404") — clicking
"Privacy Policy" today silently lands on the homepage. `/terms` has the same problem but is out of
scope for 5.14 (Terms of Service is not a data-protection requirement).

## Corrected implementation plan for 5.14

Add `/privacy` as a sixth recognized route, following the exact existing pattern used by
`/contact`:

1. `SiteRoutes::PATHS` (PHP) += `'/privacy'`.
2. `routes.ts` `ROUTES` += an entry pointing to a new `PrivacyPolicyPage.tsx` component.
3. `SEORouteContent::DEFAULTS['/privacy']` (title/description/og_type) — every other route has an
   entry; omitting one would silently skip meta tags for this route only.
4. `SitemapGenerator::ROUTE_METADATA['/privacy']` — lower priority/changefreq (e.g. `0.3` /
   `yearly`) than content routes, since policy pages rarely change and are not a primary user
   journey.
5. `PrivacyPolicyPage.tsx` imports `siteContent` from `site-content.ts` directly for business name,
   contact email, and address — no new placeholder scheme needed (see
   `AUDIT-5.14-business-metadata.md`).

No changes to `Activator.php`, no new WP option, no `wp_insert_post()` call, no new PHP class in a
`Privacy/` namespace.
