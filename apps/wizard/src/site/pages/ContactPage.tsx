import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { siteContent } from '@/site/content/site-content';

export function ContactPage(): ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text">Contact</h1>
      <div className="mt-8 space-y-6 text-base text-text">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">Phone</h2>
          <p className="mt-1">{siteContent.contact.phone}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">Email</h2>
          <p className="mt-1">
            <a href={`mailto:${siteContent.contact.email}`} className="text-primary">
              {siteContent.contact.email}
            </a>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">Address</h2>
          <p className="mt-1 whitespace-pre-line">{siteContent.contact.address}</p>
        </div>
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">Hours</h2>
          <p className="mt-1">{siteContent.contact.hours}</p>
        </div>
      </div>

      <div className="mt-12 rounded border border-border bg-surface-sunken p-6">
        <p className="text-base text-text">
          Need an estimate? The quickest way to get a written quote is the quote tool.
        </p>
        <Link
          to="/quote"
          className="mt-4 inline-block rounded border border-primary bg-primary px-4 py-2 text-text-inverse"
        >
          {siteContent.nav.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
