import type { ReactElement } from 'react';
import { cn } from '@/design/cn';
import { Link } from '@/site/routing/Link';
import { siteContent } from '@/site/content/site-content';
import { PageContainer } from '@/components/primitives/PageContainer';
import { buttonClassName } from '@/components/primitives/Button';
import { Card } from '@/components/primitives/Card';

export function ContactPage(): ReactElement {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-text-inverse">Contact</h1>
      <div className="mt-8 space-y-6 text-base text-text-inverse">
        <div>
          <h2 className="text-xl font-semibold text-text-inverse">Phone</h2>
          <p className="mt-1">{siteContent.contact.phone}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-inverse">Email</h2>
          <p className="mt-1">
            <a href={`mailto:${siteContent.contact.email}`} className="text-primary-inverse">
              {siteContent.contact.email}
            </a>
          </p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-inverse">Address</h2>
          <p className="mt-1 whitespace-pre-line">{siteContent.contact.address}</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-text-inverse">Hours</h2>
          <p className="mt-1">{siteContent.contact.hours}</p>
        </div>
      </div>

      <Card surface="dark" className="mt-12">
        <p className="text-base text-text-inverse">
          Need an estimate? The quickest way to get a written quote is the quote tool.
        </p>
        <Link to="/quote" className={cn('mt-4', buttonClassName('primary', 'lg'))}>
          {siteContent.nav.ctaLabel}
        </Link>
      </Card>
    </PageContainer>
  );
}
