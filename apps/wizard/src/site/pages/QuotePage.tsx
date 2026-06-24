import { useState, useMemo, type ReactElement } from 'react';

import { config } from '@/config-loader';
import {
  listEnabledServiceIds,
  listCategories,
  resolveService,
  resolveFallbackVertical,
} from '@/domain/registry';
import type { ServiceConfig } from '@/domain/registry';
import {
  createWizardStore,
  WizardProvider,
  sessionStorageAdapter,
  httpSubmissionPort,
} from '@/runtime';
import type { SubmissionPort } from '@/runtime';
import { PhotoStore } from '@/runtime/photos-store';
import { createPhotoEnrichedPort } from '@/runtime/submission-media';
import { useCategorySelection } from '@/runtime/hooks/useCategorySelection';
import { addressPreStep } from '@/domain/wizards/address-prestep';
import { ServiceSelector, CategorySelector } from '@/components/selection';
import { WizardShell } from '@/components/WizardShell';

const devSubmissionPort: SubmissionPort = {
  submit: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true, reference: `dev-${Date.now()}` }), 800),
    ),
};

const baseSubmissionPort: SubmissionPort =
  config.restUrl !== ''
    ? httpSubmissionPort({ restUrl: config.restUrl, restNonce: config.restNonce })
    : devSubmissionPort;

// Compute once at module load — config is frozen, registry is frozen.
const enabledIds = listEnabledServiceIds(config.enabledServiceIds);
const services = enabledIds
  .map((id) => resolveService(id))
  .filter((s): s is ServiceConfig => s !== null);
const categories = listCategories();

/**
 * The Quote page. Per-session service selection — state is local to this
 * page's mount, so navigating away and back resets the selector. The wizard's
 * own sessionStorageAdapter (4.2) preserves draft answers across remounts for
 * a chosen service.
 *
 * Single-service bypass: when exactly one service is enabled, the wizard
 * mounts immediately without showing the selector.
 *
 * NOTE: wizard wiring moved from App.tsx during Step 5.0 without modification.
 */
export function QuotePage(): ReactElement {
  const { selectedCategoryId, selectCategory } = useCategorySelection();
  const [selectedId, setSelectedId] = useState<string | null>(
    services.length === 1 ? (services[0]?.id ?? null) : null,
  );

  const wizardResources = useMemo(() => {
    if (selectedId === null) return null;
    const service = resolveService(selectedId);
    if (service === null) return null;
    const photoStore = new PhotoStore();
    const enrichedPort = createPhotoEnrichedPort(baseSubmissionPort, photoStore);
    const store = createWizardStore(
      { wizard: service.wizard, pricing: service.pricing, preSteps: [addressPreStep] },
      sessionStorageAdapter,
      enrichedPort,
    );
    return { store, photoStore };
  }, [selectedId]);

  if (services.length === 0) {
    const fallback = resolveFallbackVertical();
    if (fallback === null) {
      console.error(
        '[quote-wizard] No vertical could be resolved (configured ids and fallback both unknown). Wizard will not mount.',
      );
      return (
        <div role="alert" className="mx-auto max-w-3xl px-6 py-12 text-sm text-text">
          This wizard could not be configured. Please contact the site administrator.
        </div>
      );
    }
    const fallbackPhotoStore = new PhotoStore();
    const fallbackStore = createWizardStore(
      { wizard: fallback.wizard, pricing: fallback.pricing, preSteps: [addressPreStep] },
      sessionStorageAdapter,
      createPhotoEnrichedPort(baseSubmissionPort, fallbackPhotoStore),
    );
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <WizardProvider store={fallbackStore} photoStore={fallbackPhotoStore}>
          <WizardShell />
        </WizardProvider>
      </div>
    );
  }

  if (selectedId === null) {
    // Category navigation phase (ADR-0017): show CategorySelector first when enabled.
    if (config.enableCategoryNavigation && categories.length > 0 && selectedCategoryId === null) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-12">
          <CategorySelector categories={categories} onSelect={selectCategory} />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ServiceSelector
          services={services}
          onSelect={setSelectedId}
          filterByCategoryId={selectedCategoryId ?? undefined}
        />
      </div>
    );
  }

  if (wizardResources === null) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <ServiceSelector
          services={services}
          onSelect={setSelectedId}
          filterByCategoryId={selectedCategoryId ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <WizardProvider store={wizardResources.store} photoStore={wizardResources.photoStore}>
        <WizardShell onReturnToSelector={() => setSelectedId(null)} />
      </WizardProvider>
    </div>
  );
}
