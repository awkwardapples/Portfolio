import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { siteContent } from '@/site/content/site-content';
import { services } from '@/site/content/services-content';
import { servicePages } from '@/site/content/service-pages-content';
import { PageContainer } from '@/components/primitives/PageContainer';
import { buttonClassName } from '@/components/primitives/Button';

export function ServicesPage(): ReactElement {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-text-inverse">Services</h1>
      <ul className="mt-8 space-y-8" role="list">
        {services.map((service) => {
          // A service may have a dedicated SEO landing page (Step 6.8). If so,
          // its heading links there instead of showing as plain text. Assumes
          // at most one landing page per serviceId today.
          const landingPage = servicePages.find((page) => page.serviceId === service.id);

          return (
            <li key={service.id}>
              <h2 className="text-xl font-semibold text-text-inverse">
                {landingPage ? (
                  <Link to={landingPage.path} className="underline hover:no-underline">
                    {landingPage.navLabel}
                  </Link>
                ) : (
                  service.name
                )}
              </h2>
              <p className="mt-2 text-base text-text-inverse">{service.description}</p>
            </li>
          );
        })}
      </ul>
      <div className="mt-12">
        <Link to="/quote" className={buttonClassName('primary', 'lg')}>
          {siteContent.nav.ctaLabel}
        </Link>
      </div>
    </PageContainer>
  );
}
