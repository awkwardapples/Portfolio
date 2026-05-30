import { config } from '@/config-loader';
import { resolveVertical, resolveFallbackVertical } from '@/domain/registry';
import {
  createWizardStore,
  WizardProvider,
  sessionStorageAdapter,
  httpSubmissionPort,
} from '@/runtime';
import type { SubmissionPort } from '@/runtime';
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
        submissionPort,
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
