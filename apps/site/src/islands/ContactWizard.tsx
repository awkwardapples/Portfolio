import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';

import { WizardShell } from '@/components/WizardShell';
import type { AnyStep, WizardConfig } from '@/domain/config/wizard-config';
import { manualQuotePricingStub } from '@/domain/fixtures/manual-quote-pricing-stub';
import {
  createWizardStore,
  httpSubmissionPort,
  sessionStorageAdapter,
  WizardProvider,
} from '@/runtime';
import { BotProtectionStore } from '@/runtime/bot-protection-store';
import {
  ContentResultsProvider,
  type ContentResultAction,
  type ContentResultItem,
} from '@/runtime/content-results';
import { WizardCopyProvider, type WizardCopy } from '@/runtime/copy';
import { WizardEnvironmentProvider } from '@/runtime/environment';
import { createBotProtectionEnrichedPort } from '@/runtime/submission-bot-protection';

import { INTENT_KEY } from '~/lib/intents';
import type { Selection } from '~/wizard/content-index';
import {
  CONTACT_INTENT_IDS,
  CONTACT_WIZARDS,
  INTENT_DESCRIPTIONS,
  INTENT_FROM_THRESHOLD,
  INTENT_LABELS,
  isContactIntent,
  type ContactIntentId,
} from '~/wizard/intents';

export interface ContactWizardProps {
  /** Result items per selection, computed at build time (spec I.4). */
  results: Record<Selection, ContentResultItem[]>;
  /** The CV download, offered after the hiring result (spec Y.5) once the CV exists. */
  cvAction?: ContentResultAction | undefined;
  /** Shown at the top of the hiring result (spec Y.5): the availability sentence. */
  hiringIntro?: string | undefined;
  /** The public Turnstile site key; empty disables Turnstile (development, tests). */
  turnstileSiteKey: string;
  endpointUrl: string;
}

/** The action the Worker requires on Turnstile tokens (spec Q.2). */
const TURNSTILE_ACTION = 'contact-submit';

const THRESHOLD_FOR: Record<ContactIntentId, string> = {
  hiring: 'hiring',
  research: 'research',
  website: 'website',
  music: 'music',
  other: 'looking',
};

/** ?intent= first, then the answer given on the homepage threshold (spec I.2). */
function initialIntent(): ContactIntentId | null {
  const fromUrl = new URLSearchParams(window.location.search).get('intent');
  if (isContactIntent(fromUrl)) return fromUrl;
  if (fromUrl && fromUrl in INTENT_FROM_THRESHOLD) {
    return INTENT_FROM_THRESHOLD[fromUrl as keyof typeof INTENT_FROM_THRESHOLD];
  }
  try {
    const stored = JSON.parse(localStorage.getItem(INTENT_KEY) ?? 'null') as {
      value?: string;
    } | null;
    const value = stored?.value;
    if (value && value in INTENT_FROM_THRESHOLD) {
      return INTENT_FROM_THRESHOLD[value as keyof typeof INTENT_FROM_THRESHOLD];
    }
  } catch {
    // Storage unavailable: show the selector.
  }
  return null;
}

/**
 * The wizard as this visit should see it: result steps with nothing to show
 * are left out (spec T.4), and the hiring result opens with the availability
 * sentence. Only presentation changes, so the Worker's validation against
 * the unmodified CONTACT_WIZARDS still applies: result steps hold no answers.
 */
type PrimaryActions = Partial<Record<Selection, ContentResultAction>>;

function forDisplay(
  config: WizardConfig,
  results: ContactWizardProps['results'],
  primaryActions: PrimaryActions,
  hiringIntro: string | undefined,
): WizardConfig {
  const steps = config.steps
    .filter(
      (step: AnyStep) =>
        !('stepKind' in step) ||
        step.stepKind !== 'content-result' ||
        results[step.selection].length > 0 ||
        primaryActions[step.selection] !== undefined,
    )
    .map((step: AnyStep) =>
      'stepKind' in step &&
      step.stepKind === 'content-result' &&
      config.id === 'hiring' &&
      hiringIntro
        ? { ...step, description: hiringIntro }
        : step,
    );
  return { ...config, steps };
}

function IntentSelector({
  onSelect,
}: {
  onSelect: (intent: ContactIntentId) => void;
}): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <section
      aria-labelledby="contact-intent-heading"
      className="rounded border border-border bg-surface p-6"
    >
      <h2
        id="contact-intent-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-text outline-none"
      >
        What brings you here?
      </h2>
      <ul className="mt-6 flex flex-col gap-3" role="list">
        {CONTACT_INTENT_IDS.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className="flex min-h-11 w-full flex-col items-start rounded border border-border-strong px-4 py-3 text-left hover:bg-surface-sunken"
            >
              <span className="text-base font-medium text-text">{INTENT_LABELS[id]}</span>
              <span className="text-sm text-text-muted">{INTENT_DESCRIPTIONS[id]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const COPY: Partial<WizardCopy> = {
  successTitle: 'Message sent',
  successBody: (answers) =>
    typeof answers.contact_email === 'string' && answers.contact_email.trim() !== ''
      ? `Thank you. I'll reply to ${answers.contact_email.trim()}.`
      : "Thank you. I'll reply by email.",
  duplicateTitle: 'I already have your message',
  duplicateBody: "I already have a message from you today. I'll reply to both together.",
  referenceLabel: 'Reference',
  failureTitle: 'Your message was not sent',
  failureFallback: 'Your message could not be sent. Please try again.',
  submittingLabel: 'Sending your message',
  submitLabel: 'Send',
  skipAndSubmitLabel: 'Skip and send',
  screenHeadingLevel: 'h2',
  successExtras: (
    <p className="mt-6 flex flex-wrap justify-center gap-x-6 text-sm">
      <a href="/" className="inline-flex min-h-11 items-center underline underline-offset-4">
        Back to the homepage
      </a>
      <a href="/work" className="inline-flex min-h-11 items-center underline underline-offset-4">
        See my work
      </a>
    </p>
  ),
};

/**
 * "What brings you here?" on /contact (spec I.2, I.5): the intent, two or
 * three questions, a result drawn from the site's content, your details,
 * optional details, sent. Adapted from the SCB QuotePage: the same store,
 * persistence (per intent, in session storage), bot protection and HTTP
 * port, configured by props instead of window.GOQW_CONFIG, with no pre-steps.
 */
export function ContactWizard({
  results,
  cvAction,
  hiringIntro,
  turnstileSiteKey,
  endpointUrl,
}: ContactWizardProps): ReactElement {
  const [intent, setIntent] = useState<ContactIntentId | null>(() => initialIntent());

  useEffect(() => {
    const url = new URL(window.location.href);
    if (intent) url.searchParams.set('intent', intent);
    else url.searchParams.delete('intent');
    history.replaceState(history.state, '', url);
  }, [intent]);

  const choose = (id: ContactIntentId) => {
    try {
      localStorage.setItem(
        INTENT_KEY,
        JSON.stringify({ value: THRESHOLD_FOR[id], at: new Date().toISOString() }),
      );
    } catch {
      // The choice still applies to this visit.
    }
    setIntent(id);
  };

  const primaryActions = useMemo<PrimaryActions>(
    () => (intent === 'hiring' && cvAction ? { featured: cvAction } : {}),
    [intent, cvAction],
  );

  const resources = useMemo(() => {
    if (intent === null) return null;
    const botProtectionStore = new BotProtectionStore();
    const port = createBotProtectionEnrichedPort(
      httpSubmissionPort({ endpointUrl }),
      botProtectionStore,
    );
    const wizard = forDisplay(CONTACT_WIZARDS[intent], results, primaryActions, hiringIntro);
    const store = createWizardStore(
      // Manual mode: nothing is priced, so the engine's manual-quote stub stands in.
      { wizard, pricing: manualQuotePricingStub, preSteps: [] },
      sessionStorageAdapter,
      port,
    );
    return { store, botProtectionStore };
  }, [intent, endpointUrl, results, primaryActions, hiringIntro]);

  if (intent === null || resources === null) {
    return <IntentSelector onSelect={choose} />;
  }

  return (
    <WizardEnvironmentProvider value={{ turnstileSiteKey, turnstileAction: TURNSTILE_ACTION }}>
      <WizardCopyProvider value={COPY}>
        <ContentResultsProvider
          value={{ items: results, primaryActions, onExit: () => window.location.assign('/') }}
        >
          <WizardProvider store={resources.store} botProtectionStore={resources.botProtectionStore}>
            <WizardShell
              landmark={false}
              className="space-y-4"
              onReturnToSelector={() => setIntent(null)}
            />
          </WizardProvider>
        </ContentResultsProvider>
      </WizardCopyProvider>
    </WizardEnvironmentProvider>
  );
}
