import type { ReactElement } from 'react';

import type { ServiceConfig } from '@/domain/registry';
import { ServiceCard } from '@/components/selection/ServiceCard';

interface ServiceSelectorProps {
  /** Ordered list of services to display. */
  readonly services: readonly ServiceConfig[];
  /** Called when the user selects a service. */
  readonly onSelect: (serviceId: string) => void;
}

/**
 * Service selection screen (Step 4.7).
 *
 * Rendered when more than one service is enabled for this deployment. The user
 * picks one; the parent mounts the wizard with the chosen service's config.
 *
 * Accessible by construction: each service is a <button> (keyboard activatable),
 * the heading is a semantic <h1>, the list is a real <ul>. No marketing copy;
 * the heading is operational (ADR-0012). Uses only closed Tailwind palette.
 *
 * This screen mounts at App.tsx's root in Phase 4. It will move to the site
 * shell's QuotePage in Phase 5 once the site template layer exists.
 */
export function ServiceSelector({ services, onSelect }: ServiceSelectorProps): ReactElement {
  return (
    <section className="mx-auto max-w-2xl p-6">
      <h1 className="text-xl font-semibold text-text">What would you like a quote for?</h1>
      <p className="mt-2 text-base text-text-muted">Choose a service to start your quote.</p>
      <ul className="mt-6 space-y-3" role="list">
        {services.map((service) => (
          <li key={service.id}>
            <ServiceCard service={service} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  );
}
