import { useRef, useEffect, useState } from 'react';

import type { SizeBracketSelectorStep as SizeBracketSelectorStepConfig } from '@/domain/config/wizard-config';
import { useWizard } from '@/runtime/useWizard';
import { StepCard } from '@/components/composites';
import { NavigationControls } from '@/components/steps/NavigationControls';
import { formatMeasurementRangeWithFeet, formatMeasurementWithFeet } from '@/utils/units';

interface SizeBracketSelectorStepProps {
  step: SizeBracketSelectorStepConfig;
  isFirst: boolean;
  isLast: boolean;
  onFirstBack?: () => void;
}

const EXACT_SENTINEL = 'exact';

/**
 * Renders pre-set size brackets with an exact-dimensions fallback.
 *
 * Bracket selection: clicking a bracket stores the bracket id in
 * answers[step.answerKey].
 *
 * Exact selection: clicking "I know the exact size" sets answers[step.answerKey]
 * to 'exact' and reveals numeric input fields. Each exactField's id is used
 * directly as its own answer key for the numeric value.
 *
 * Forward navigation via STEP_NEXT; backward via STEP_BACK / onFirstBack.
 */
export function SizeBracketSelectorStep({
  step,
  isFirst,
  isLast,
  onFirstBack,
}: SizeBracketSelectorStepProps): JSX.Element {
  const { state, dispatch } = useWizard();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [selectionError, setSelectionError] = useState<string | undefined>();

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const selectedMode = state.answers[step.answerKey];
  const isExactMode = selectedMode === EXACT_SENTINEL;

  function handleBracketSelect(bracketId: string, typicalValue: number | undefined): void {
    setSelectionError(undefined);
    dispatch({ type: 'ANSWER_SET', fieldKey: step.answerKey, value: bracketId });
    if (typicalValue !== undefined) {
      for (const ef of step.exactFields) {
        dispatch({ type: 'ANSWER_SET', fieldKey: ef.id, value: typicalValue });
      }
    }
  }

  function handleExactToggle(): void {
    setSelectionError(undefined);
    dispatch({ type: 'ANSWER_SET', fieldKey: step.answerKey, value: EXACT_SENTINEL });
  }

  function handleExactFieldChange(fieldId: string, raw: string): void {
    const num = parseFloat(raw);
    if (!isNaN(num) && num >= 0) {
      dispatch({ type: 'ANSWER_SET', fieldKey: fieldId, value: num });
    }
  }

  function handleNext(): void {
    if (selectedMode === undefined || selectedMode === null) {
      setSelectionError('Please select a size to continue.');
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

        <div className="flex flex-col gap-2">
          {step.brackets.map((bracket) => {
            const selected = selectedMode === bracket.id;
            return (
              <button
                key={bracket.id}
                type="button"
                onClick={() => handleBracketSelect(bracket.id, bracket.typicalValue)}
                aria-pressed={selected}
                className={[
                  'flex w-full items-center justify-between rounded border px-4 py-3 text-left transition-colors',
                  selected
                    ? 'border-primary bg-primary/10 text-text'
                    : 'border-border bg-surface text-text hover:bg-surface-sunken',
                ].join(' ')}
              >
                <span className="font-medium">{bracket.label}</span>
                <span className="text-sm text-text-muted">
                  {formatMeasurementRangeWithFeet(bracket.minValue, bracket.maxValue, bracket.unit)}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleExactToggle}
            aria-pressed={isExactMode}
            className={[
              'flex w-full items-center rounded border px-4 py-3 text-left text-sm transition-colors',
              isExactMode
                ? 'border-primary bg-primary/10 text-text'
                : 'border-border bg-surface text-text-muted hover:bg-surface-sunken',
            ].join(' ')}
          >
            {step.exactPromptLabel}
          </button>
        </div>

        {isExactMode && (
          <div className="rounded border border-border bg-surface-sunken p-4 space-y-3">
            {step.exactFields.map((exactField) => {
              const currentVal = state.answers[exactField.id];
              return (
                <div key={exactField.id}>
                  <label
                    htmlFor={`exact-${exactField.id}`}
                    className="mb-1 block text-sm font-medium text-text"
                  >
                    {exactField.label} ({exactField.unit})
                  </label>
                  <input
                    id={`exact-${exactField.id}`}
                    type="number"
                    min="0"
                    step="0.1"
                    defaultValue={typeof currentVal === 'number' ? currentVal : ''}
                    onChange={(e) => handleExactFieldChange(exactField.id, e.target.value)}
                    className="w-full rounded border border-border bg-surface px-3 py-2 text-text focus:border-primary focus:outline-none"
                  />
                  {typeof currentVal === 'number' && (
                    <p className="mt-1 text-xs text-text-muted">
                      {formatMeasurementWithFeet(currentVal, exactField.unit)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <NavigationControls onBack={handleBack} onNext={handleNext} isLast={isLast} />
      </div>
    </StepCard>
  );
}
