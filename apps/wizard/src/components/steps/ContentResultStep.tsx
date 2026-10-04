import { useEffect, useRef } from 'react';

import type { ContentResultStep as ContentResultStepConfig } from '@/domain/config/wizard-config';
import { useContentResults } from '@/runtime/content-results';
import { useWizard } from '@/runtime/useWizard';
import { useWizardCopy } from '@/runtime/copy';
import { Button } from '@/components/primitives';
import { StepCard } from '@/components/composites';

interface ContentResultStepProps {
  step: ContentResultStepConfig;
  isFirst: boolean;
  onFirstBack?: () => void;
}

/**
 * Shows what on the host site is most relevant to the answers so far
 * (portfolio spec I.4, ADR-0042), before any personal details are asked for.
 * Items come from ContentResultsContext; the engine stays content-agnostic.
 * The host's direct action for the selection (e.g. "Download CV (PDF)")
 * follows the items (portfolio spec Y.5).
 *
 * The continue button dispatches STEP_NEXT; the exit button calls the host's
 * onExit (answers stay in session storage). Like estimate-display, the step
 * has no fields and is always valid.
 */
export function ContentResultStep({
  step,
  isFirst,
  onFirstBack,
}: ContentResultStepProps): JSX.Element {
  const { dispatch } = useWizard();
  const results = useContentResults();
  const copy = useWizardCopy();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const items = results?.items[step.selection] ?? [];
  const primary = results?.primaryActions?.[step.selection];

  function handleBack(): void {
    if (isFirst && onFirstBack) onFirstBack();
    else dispatch({ type: 'STEP_BACK' });
  }

  return (
    <StepCard ref={headingRef} title={step.title} description={step.description}>
      <div className="space-y-6">
        {items.length > 0 && (
          <ul className="space-y-6" role="list">
            {items.map((item) => (
              <li key={item.url} className="flex gap-4 border-t border-border pt-6">
                {item.coverUrl && (
                  <img
                    src={item.coverUrl}
                    alt={item.coverAlt ?? ''}
                    width={96}
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-24 shrink-0 self-start rounded border border-border"
                  />
                )}
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-text">
                    <a href={item.url} className="underline-offset-4 hover:underline">
                      {item.title}
                    </a>
                  </h3>
                  {item.meta && <p className="text-sm text-text-muted">{item.meta}</p>}
                  <p className="mt-2 text-base text-text">{item.summary}</p>
                  {item.actions.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-x-4" role="list">
                      {item.actions.map((action) => (
                        <li key={action.href}>
                          <a
                            href={action.href}
                            download={action.download || undefined}
                            className="inline-flex h-11 items-center text-sm font-medium text-text underline underline-offset-4"
                          >
                            {action.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {primary && (
          <p>
            <a
              href={primary.href}
              download={primary.download || undefined}
              className="inline-flex h-11 items-center rounded bg-primary px-4 font-medium text-text-inverse hover:bg-primary/90"
            >
              {primary.label}
            </a>
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="primary" onClick={() => dispatch({ type: 'STEP_NEXT' })}>
            {step.continueLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => results?.onExit()}>
            {step.exitLabel}
          </Button>
        </div>

        <div>
          <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
            {copy.backLabel}
          </Button>
        </div>
      </div>
    </StepCard>
  );
}
