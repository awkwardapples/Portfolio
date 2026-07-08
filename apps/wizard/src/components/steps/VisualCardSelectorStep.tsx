import { useRef, useEffect, useState } from 'react';

import type { VisualCardSelectorStep as VisualCardSelectorStepConfig } from '@/domain/config/wizard-config';
import { useWizard } from '@/runtime/useWizard';
import { StepCard } from '@/components/composites';
import { NavigationControls } from '@/components/steps/NavigationControls';

interface VisualCardSelectorStepProps {
  step: VisualCardSelectorStepConfig;
  isFirst: boolean;
  isLast: boolean;
  onFirstBack?: () => void;
}

/**
 * Renders service/material choices as a grid of visual cards.
 *
 * Single selection: clicking a card stores its id in answers[step.answerKey].
 * Multiple selection: clicking cards toggles them; answer is a string[].
 *
 * Forward navigation via STEP_NEXT; backward via STEP_BACK / onFirstBack.
 */
export function VisualCardSelectorStep({
  step,
  isFirst,
  isLast,
  onFirstBack,
}: VisualCardSelectorStepProps): JSX.Element {
  const { state, dispatch } = useWizard();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const currentAnswer = state.answers[step.answerKey];
  const selectedIds: string[] = step.multiple
    ? Array.isArray(currentAnswer)
      ? (currentAnswer as string[])
      : []
    : typeof currentAnswer === 'string'
      ? [currentAnswer]
      : [];

  function isSelected(optionId: string): boolean {
    return selectedIds.includes(optionId);
  }

  function handleSelect(optionId: string): void {
    setSelectionError(undefined);
    if (step.multiple) {
      const next = isSelected(optionId)
        ? selectedIds.filter((id) => id !== optionId)
        : [...selectedIds, optionId];
      dispatch({ type: 'ANSWER_SET', fieldKey: step.answerKey, value: next });
    } else {
      dispatch({ type: 'ANSWER_SET', fieldKey: step.answerKey, value: optionId });
    }
  }

  function handleNext(): void {
    if (selectedIds.length === 0) {
      setSelectionError('Please select an option to continue.');
      return;
    }
    if (isLast) {
      dispatch({ type: 'SUBMIT_REQUESTED' });
    } else {
      dispatch({ type: 'STEP_NEXT' });
    }
  }

  function handleBack(): void {
    if (isFirst && onFirstBack) {
      onFirstBack();
    } else {
      dispatch({ type: 'STEP_BACK' });
    }
  }

  return (
    <StepCard ref={headingRef} title={step.title} description={step.description}>
      <div className="space-y-4">
        {selectionError && (
          <p role="alert" className="text-sm text-error">
            {selectionError}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {step.options.map((option) => {
            const selected = isSelected(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                aria-pressed={selected}
                className={[
                  'flex flex-col items-center gap-2 rounded border p-4 text-center transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-text'
                    : 'border-border bg-surface text-text hover:bg-surface-sunken',
                ].join(' ')}
              >
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="h-12 w-12 object-contain"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-12 w-12 items-center justify-center rounded bg-surface-sunken text-2xl text-text-muted"
                  >
                    ?
                  </div>
                )}
                <span className="text-sm font-medium">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-text-muted">{option.description}</span>
                )}
              </button>
            );
          })}
        </div>

        <NavigationControls onBack={handleBack} onNext={handleNext} isLast={isLast} />
      </div>
    </StepCard>
  );
}
