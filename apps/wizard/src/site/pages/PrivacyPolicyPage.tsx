import type { ReactElement } from 'react';
import { privacyContent } from '@/site/content/privacy-content';
import { PageContainer } from '@/components/primitives/PageContainer';

export function PrivacyPolicyPage(): ReactElement {
  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-text-inverse">Privacy Policy</h1>
      <p className="mt-2 text-sm text-text-inverse-muted">
        Last updated: {privacyContent.lastUpdated}
      </p>
      <div className="mt-8 space-y-8 text-base text-text-inverse">
        {privacyContent.sections.map((section) => (
          <div key={section.id}>
            <h2 className="text-xl font-semibold text-text-inverse">{section.heading}</h2>
            {section.body.map((paragraph, idx) => (
              <p key={idx} className="mt-2 whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
