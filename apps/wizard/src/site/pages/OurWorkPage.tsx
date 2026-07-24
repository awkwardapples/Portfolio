import type { ReactElement } from 'react';
import { works } from '@/site/content/work-content';
import { services } from '@/site/content/services-content';
import { PageContainer } from '@/components/primitives/PageContainer';
import { Card } from '@/components/primitives/Card';

export function OurWorkPage(): ReactElement {
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? id;

  return (
    <PageContainer>
      <h1 className="text-2xl font-semibold text-text-inverse">Our work</h1>
      <p className="mt-3 text-base text-text-inverse-muted">
        Recent projects across {services.map((s) => s.name.toLowerCase()).join(' and ')}.
      </p>
      <ul className="mt-8 space-y-8" role="list">
        {works.map((entry) => (
          <li key={entry.id}>
            <Card surface="dark">
              <h2 className="text-lg font-medium text-text-inverse">{entry.title}</h2>
              <p className="mt-1 text-sm text-text-inverse-muted">{serviceName(entry.serviceId)}</p>
              <p className="mt-3 text-base text-text-inverse">{entry.description}</p>
            </Card>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
