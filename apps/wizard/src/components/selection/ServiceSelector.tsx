import type { ReactElement } from 'react';

import type { ServiceConfig } from '@/domain/registry';
import { VERTICALS } from '@/domain/registry';
import { ServiceCard } from '@/components/selection/ServiceCard';

interface ServiceSelectorProps {
  /** Ordered list of services to display. */
  readonly services: readonly ServiceConfig[];
  /** Called when the user selects a service. */
  readonly onSelect: (serviceId: string) => void;
  /**
   * When set, only services whose Vertical.categoryId matches this value are
   * shown. Used by the category-navigation phase (ADR-0017). When absent,
   * all services in the `services` prop are displayed.
   */
  readonly filterByCategoryId?: string;
  /**
   * When provided alongside filterByCategoryId, renders a back button at the
   * top of the service list allowing the user to return to category selection.
   */
  readonly onReturnToCategorySelection?: () => void;
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
 */
export function ServiceSelector({
  services,
  onSelect,
  filterByCategoryId,
  onReturnToCategorySelection,
}: ServiceSelectorProps): ReactElement {
  const visibleServices =
    filterByCategoryId !== undefined
      ? services.filter((s) => VERTICALS[s.id]?.categoryId === filterByCategoryId)
      : services;

  return (
    <section className="mx-auto max-w-2xl p-6">
      {filterByCategoryId !== undefined && onReturnToCategorySelection !== undefined && (
        <button
          type="button"
          className="mb-6 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text"
          onClick={onReturnToCategorySelection}
          aria-label="Back to all categories"
        >
          <span aria-hidden="true">&#8592;</span>
          All categories
        </button>
      )}
      <h1 className="text-xl font-semibold text-text">What would you like a quote for?</h1>
      <p className="mt-2 text-base text-text-muted">Choose a service to start your quote.</p>
      <ul className="mt-6 space-y-3" role="list">
        {visibleServices.map((service) => (
          <li key={service.id}>
            <ServiceCard service={service} onSelect={onSelect} />
          </li>
        ))}
      </ul>
    </section>
  );
}
