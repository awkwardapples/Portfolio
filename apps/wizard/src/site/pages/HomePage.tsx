import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { siteContent } from '@/site/content/site-content';
import { services } from '@/site/content/services-content';

export function HomePage(): ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text">{siteContent.home.heading}</h1>
      <p className="mt-3 text-lg text-text-muted">{siteContent.home.subheading}</p>
      <p className="mt-6 text-base text-text">{siteContent.home.intro}</p>

      <div className="mt-8">
        <Link
          to="/quote"
          className="inline-block rounded border border-primary bg-primary px-4 py-2 text-text-inverse"
        >
          {siteContent.nav.ctaLabel}
        </Link>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-text">What we do</h2>
        <ul className="mt-4 space-y-4" role="list">
          {services.map((service) => (
            <li key={service.id}>
              <h3 className="text-base font-medium text-text">{service.name}</h3>
              <p className="mt-1 text-base text-text-muted">{service.summary}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
