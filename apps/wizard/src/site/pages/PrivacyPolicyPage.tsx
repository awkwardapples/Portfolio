import type { ReactElement } from 'react';
import { privacyContent } from '@/site/content/privacy-content';

export function PrivacyPolicyPage(): ReactElement {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-muted">Last updated: {privacyContent.lastUpdated}</p>
      <div className="mt-8 space-y-8 text-base text-text">
        {privacyContent.sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">
              {section.heading}
            </h2>
            {section.body.map((paragraph, idx) => (
              <p key={idx} className="mt-2 whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
