import { createContext, useContext, type ReactNode } from 'react';

import type { AnswerMap } from '@/domain/runtime/answer-types';

/**
 * The words the wizard's own screens and controls use (portfolio spec I.6
 * item 2, ADR-0042). The defaults are the SCB quote wizard's existing
 * strings, so a host that provides nothing sees no change. The portfolio's
 * contact island provides first-person copy.
 *
 * Success and duplicate bodies can depend on the answers (for example, to
 * name the address the reply will go to).
 */
export interface WizardCopy {
  readonly successTitle: string;
  readonly successBody: string | ((answers: AnswerMap) => string);
  readonly duplicateTitle: string;
  readonly duplicateBody: string | ((answers: AnswerMap) => string);
  readonly referenceLabel: string;
  /** Shown under the success message, e.g. links back into the host site. */
  readonly successExtras?: ReactNode;
  readonly failureTitle: string;
  readonly rateLimitedTitle: string;
  readonly failureFallback: string;
  readonly retryLabel: string;
  readonly submittingLabel: string;
  readonly backLabel: string;
  readonly nextLabel: string;
  readonly submitLabel: string;
  readonly skipAndSubmitLabel: string;
  readonly selectorHeading: string;
  readonly selectorDescription: string;
  /**
   * The heading level of the success, failure and selector screens: h1 when
   * the wizard is the page (SCB), h2 when the host page has its own h1.
   */
  readonly screenHeadingLevel: 'h1' | 'h2';
}

export const DEFAULT_WIZARD_COPY: WizardCopy = Object.freeze({
  successTitle: 'Quote request received',
  successBody: 'We will be in touch shortly with your personalised quote.',
  duplicateTitle: 'We already have your request',
  duplicateBody:
    'We received a matching request from you recently. We will be in touch soon — no need to submit again.',
  referenceLabel: 'Reference',
  failureTitle: 'Something went wrong',
  rateLimitedTitle: 'Please wait a moment',
  failureFallback: 'Your request could not be submitted. Please try again.',
  retryLabel: 'Try again',
  submittingLabel: 'Submitting your request',
  backLabel: 'Back',
  nextLabel: 'Next',
  submitLabel: 'Submit',
  skipAndSubmitLabel: 'Skip and Submit',
  selectorHeading: 'What would you like a quote for?',
  selectorDescription: 'Choose a service to start your quote.',
  screenHeadingLevel: 'h1',
});

const WizardCopyContext = createContext<WizardCopy>(DEFAULT_WIZARD_COPY);

/** Provide copy; anything left out keeps its default. */
export function WizardCopyProvider({
  value,
  children,
}: {
  value: Partial<WizardCopy>;
  children: ReactNode;
}): JSX.Element {
  return (
    <WizardCopyContext.Provider value={{ ...DEFAULT_WIZARD_COPY, ...value }}>
      {children}
    </WizardCopyContext.Provider>
  );
}

export function useWizardCopy(): WizardCopy {
  return useContext(WizardCopyContext);
}

/** Resolve a copy value that may depend on the answers. */
export function resolveCopy(
  value: string | ((answers: AnswerMap) => string),
  answers: AnswerMap,
): string {
  return typeof value === 'function' ? value(answers) : value;
}
