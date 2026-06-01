import type { ReactElement } from 'react';

import type { ServiceConfig } from '@/domain/registry';

interface ServiceCardProps {
  readonly service: ServiceConfig;
  readonly onSelect: (serviceId: string) => void;
}

/**
 * A single service card. Full-width clickable button for keyboard accessibility.
 * The visible label is the wizard title (the product name users recognise), not
 * the registry label (which is for diagnostics only).
 *
 * No icons: per-service icon assets are out of scope for this reference template.
 * Uses only existing border + surface tokens (ADR-0012: no raw hex, no gradients,
 * no inline styles, no decorative ornament).
 */
export function ServiceCard({ service, onSelect }: ServiceCardProps): ReactElement {
  return (
    <button
      type="button"
      onClick={() => onSelect(service.id)}
      className="w-full rounded border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="block text-base font-medium text-text">{service.wizard.title}</span>
    </button>
  );
}
