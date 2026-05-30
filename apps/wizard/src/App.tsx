import { config } from '@/config-loader';
import { resolveVertical, resolveFallbackVertical } from '@/domain/registry';
import { createWizardStore, WizardProvider, sessionStorageAdapter } from '@/runtime';
import type { SubmissionPort } from '@/runtime';
import { WizardShell } from '@/components/WizardShell';

const devSubmissionPort: SubmissionPort = {
  submit: () =>
    new Promise((resolve) =>
      setTimeout(() => resolve({ ok: true, reference: `dev-${Date.now()}` }), 800),
    ),
};

const session = resolveVertical(config.wizardId) ?? resolveFallbackVertical();

if (session === null) {
  // Pathological: configured wizardId unknown AND fallback corrupt.
  // The wizard must not mount with no config.
  console.error(
    '[quote-wizard] No vertical could be resolved (configured id and fallback both unknown). Wizard will not mount.',
  );
}

const store =
  session !== null
    ? createWizardStore(
        { wizard: session.wizard, pricing: session.pricing },
        sessionStorageAdapter,
        devSubmissionPort,
      )
    : null;

export function App(): JSX.Element {
  if (store === null) {
    return (
      <div role="alert" className="p-6 text-sm text-text">
        This wizard could not be configured. Please contact the site administrator.
      </div>
    );
  }

  return (
    <WizardProvider store={store}>
      <WizardShell />
    </WizardProvider>
  );
}
