import { useCallback, useEffect, useRef, useState } from 'react';

import { config } from '@/config-loader';
import type { Step } from '@/domain/config/wizard-config';
import type { AnswerValue } from '@/domain/runtime/answer-types';
import { isPhotoAnswerValue } from '@/domain/runtime/photos';
import { useWizard } from '@/runtime/useWizard';
import { usePhotoStore } from '@/runtime/hooks/usePhotoStore';
import { StepCard } from '@/components/composites';
import { TurnstileWidget } from '@/components/TurnstileWidget';

import { FieldRenderer } from './FieldRenderer';
import { NavigationControls } from './NavigationControls';
import { isSubmissionBlocked } from './submission-gate';

interface StepRendererProps {
  step: Step;
  isFirst: boolean;
  isLast: boolean;
  /** Called when Back is pressed on the first step — routes to the service selector. */
  onFirstBack?: () => void;
}

/**
 * Renders a single wizard step with its fields, local touched/error tracking,
 * and navigation controls.
 *
 * Keyed on step.id by the parent so local state resets cleanly on step change.
 *
 * Validation display: silent until a field is blurred (touched) OR the user
 * clicks Next/Submit (showAllErrors). Errors come from validationByStep in
 * FSM state — this component never duplicates validation logic.
 */
export function StepRenderer({
  step,
  isFirst,
  isLast,
  onFirstBack,
}: StepRendererProps): JSX.Element {
  const { state, dispatch } = useWizard();
  const photoStore = usePhotoStore();
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [showAllErrors, setShowAllErrors] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Disable Submit when any photo field has metadata entries missing base64
  // (user reloaded the page mid-session; photos must be re-attached).
  const hasMissingPhotos =
    isLast &&
    photoStore !== null &&
    step.fields.some((field) => {
      if (field.type !== 'photo') return false;
      const answer = state.answers[field.key];
      if (!isPhotoAnswerValue(answer)) return false;
      return answer.files.some((meta) => !photoStore.has(meta.fileId));
    });

  // Step 5.13f: when Turnstile is configured for this deployment, disable
  // Submit on the final step until a token has been issued. Not gated at
  // all when config.turnstileSiteKey is empty (Turnstile not configured) —
  // turnstileReady starts true in that case so it never blocks submission.
  const turnstileConfigured = isLast && config.turnstileSiteKey !== '';
  const [turnstileReady, setTurnstileReady] = useState(!turnstileConfigured);
  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileReady(token !== null);
  }, []);

  // Focus the heading when this step mounts (step change via key prop).
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const snapshot = state.validationByStep[step.id];

  function getError(fieldKey: string): string | undefined {
    if (!showAllErrors && !touched.has(fieldKey)) return undefined;
    return snapshot?.issues.find((issue) => issue.fieldKey === fieldKey)?.message;
  }

  function handleChange(fieldKey: string, value: AnswerValue): void {
    dispatch({ type: 'ANSWER_SET', fieldKey, value });
  }

  function handleBlur(fieldKey: string): void {
    setTouched((prev) => new Set([...prev, fieldKey]));
    dispatch({ type: 'VALIDATE_STEP', stepId: step.id });
  }

  function handleNext(): void {
    setShowAllErrors(true);
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

  function handleSkip(): void {
    // Defense in depth (Step 6.7, ADR-0038): the disabled attribute on the
    // Skip button (below) is the primary gate, but a defensive check here
    // means a DOM-manipulated click can't bypass it — same protection the
    // disabled attribute alone provides for the regular Submit path, made
    // explicit for the newer, previously-ungated path.
    if (isSubmissionBlocked({ hasMissingPhotos, turnstileReady })) {
      return;
    }
    dispatch({ type: 'SUBMIT_REQUESTED' });
  }

  const errorCount = showAllErrors && snapshot && !snapshot.valid ? snapshot.issues.length : 0;

  return (
    <StepCard ref={headingRef} title={step.title} description={step.description}>
      {/* Screen-reader announcement when errors appear after submit attempt. */}
      <div aria-live="polite" className="sr-only">
        {errorCount > 0
          ? `${errorCount} error${errorCount === 1 ? '' : 's'} found. Please review your answers.`
          : ''}
      </div>

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <div className="space-y-6">
          {step.fields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              value={state.answers[field.key]}
              error={getError(field.key)}
              onChange={(value) => handleChange(field.key, value)}
              onBlur={() => handleBlur(field.key)}
            />
          ))}
        </div>

        {isLast && <TurnstileWidget onTokenChange={handleTurnstileTokenChange} />}

        <NavigationControls
          onBack={handleBack}
          onNext={handleNext}
          isLast={isLast}
          disabled={isSubmissionBlocked({ hasMissingPhotos, turnstileReady })}
          onSkip={isLast && step.allowSkip ? handleSkip : undefined}
        />
      </form>
    </StepCard>
  );
}
