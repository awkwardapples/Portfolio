import type { ReactElement } from 'react';
import { siteContent } from '@/site/content/site-content';

export function Footer(): ReactElement {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-border bg-surface-sunken">
      <div className="mx-auto max-w-5xl p-6 text-sm text-text-muted">
        <p className="font-medium text-text">{siteContent.businessName}</p>
        <p className="mt-1">{siteContent.footerNote}</p>
        <p className="mt-3">
          {siteContent.contact.phone} · {siteContent.contact.email}
        </p>
        <p className="mt-3 text-text-subtle">
          © {year} {siteContent.businessName}
        </p>
      </div>
    </footer>
  );
}
