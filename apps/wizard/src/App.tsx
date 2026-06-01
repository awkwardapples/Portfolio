import { useState, useMemo, type ReactElement } from 'react';

import { config } from '@/config-loader';
import { listEnabledServiceIds, resolveService, resolveFallbackVertical } from '@/domain/registry';
import type { ServiceConfig } from '@/domain/registry';
import {
  createWizardStore,
  WizardProvider,
  sessionStorageAdapter,
  httpSubmissionPort,
} from '@/runtime';
import type { SubmissionPort } from '@/runtime';
import { ServiceSelector } from '@/components/selection';
import { WizardShell } from '@/components/WizardShell';

// Development fallback: resolves after 800 ms to simulate a real round-trip.
// Used when config.restUrl is empty (pnpm dev outside WordPress).
const devSubmissionPort: SubmissionPort = {
  submit: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true, reference: `dev-${Date.now()}` }), 800),
    ),
};

const submissionPort: SubmissionPort =
  config.restUrl !== ''
    ? httpSubmissionPort({ restUrl: config.restUrl, restNonce: config.restNonce })
    : devSubmissionPort;

// Compute once at module load — config is frozen, registry is frozen.
const enabledIds = listEnabledServiceIds(config.enabledServiceIds);
const services = enabledIds
  .map((id) => resolveService(id))
  .filter((s): s is ServiceConfig => s !== null);

export function App(): ReactElement {
  // Auto-select when exactly one service is offered (single-service bypass).
  const [selectedId, setSelectedId] = useState<string | null>(
    services.length === 1 ? (services[0]?.id ?? null) : null,
  );

  // Memoise by selectedId so the wizard state is not reset on parent re-renders.
  const store = useMemo(() => {
    if (selectedId === null) return null;
    const service = resolveService(selectedId);
    if (service === null) return null;
    return createWizardStore(
      { wizard: service.wizard, pricing: service.pricing },
      sessionStorageAdapter,
      submissionPort,
    );
  }, [selectedId]);

  // Pathological: all configured ids were unknown AND the fallback is corrupt.
  if (services.length === 0) {
    const fallback = resolveFallbackVertical();
    if (fallback === null) {
      console.error(
        '[quote-wizard] No vertical could be resolved (configured ids and fallback both unknown). Wizard will not mount.',
      );
      return (
        <div role="alert" className="p-6 text-sm text-text">
          This wizard could not be configured. Please contact the site administrator.
        </div>
      );
    }
    // Mount the fallback vertical directly — no selector, no choice.
    const fallbackStore = createWizardStore(
      { wizard: fallback.wizard, pricing: fallback.pricing },
      sessionStorageAdapter,
      submissionPort,
    );
    return (
      <WizardProvider store={fallbackStore}>
        <WizardShell />
      </WizardProvider>
    );
  }

  // Multiple services and no selection yet — show the selector.
  if (selectedId === null) {
    return <ServiceSelector services={services} onSelect={setSelectedId} />;
  }

  // Defensive: selectedId set but failed to resolve (shouldn't happen).
  if (store === null) {
    return <ServiceSelector services={services} onSelect={setSelectedId} />;
  }

  return (
    <WizardProvider store={store}>
      <WizardShell />
    </WizardProvider>
  );
}
