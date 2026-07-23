import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { siteContent } from '@/site/content/site-content';
import { services } from '@/site/content/services-content';
import { servicePages } from '@/site/content/service-pages-content';

export function ServicesPage(): ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text">Services</h1>
      <ul className="mt-8 space-y-8" role="list">
        {services.map((service) => {
          // A service may have a dedicated SEO landing page (Step 6.8). If so,
          // its heading links there instead of showing as plain text. Assumes
          // at most one landing page per serviceId today.
          const landingPage = servicePages.find((page) => page.serviceId === service.id);

          return (
            <li key={service.id}>
              <h2 className="text-xl font-semibold text-text">
                {landingPage ? (
                  <Link to={landingPage.path} className="underline hover:no-underline">
                    {landingPage.navLabel}
                  </Link>
                ) : (
                  service.name
                )}
              </h2>
              <p className="mt-2 text-base text-text">{service.description}</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-12">
        <Link
          to="/quote"
          className="inline-block rounded border border-primary bg-primary px-4 py-2 text-text-inverse"
        >
          {siteContent.nav.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
