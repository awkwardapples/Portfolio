import type { ReactElement } from 'react';
import { works } from '@/site/content/work-content';
import { services } from '@/site/content/services-content';

export function OurWorkPage(): ReactElement {
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? id;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-text">Our work</h1>
      <p className="mt-3 text-base text-text-muted">
        Recent projects across {services.map((s) => s.name.toLowerCase()).join(' and ')}.
      </p>
      <ul className="mt-8 space-y-8" role="list">
        {works.map((entry) => (
          <li key={entry.id} className="rounded border border-border bg-surface p-6">
            <h2 className="text-lg font-medium text-text">{entry.title}</h2>
            <p className="mt-1 text-sm text-text-muted">{serviceName(entry.serviceId)}</p>
            <p className="mt-3 text-base text-text">{entry.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
