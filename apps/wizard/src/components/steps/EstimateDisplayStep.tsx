import { useRef, useEffect } from 'react';

import type { EstimateDisplayStep as EstimateDisplayStepConfig } from '@/domain/config/wizard-config';
import { selectPrice } from '@/domain/pricing';
import { useWizard } from '@/runtime/useWizard';
import { useWizardStore } from '@/runtime/WizardProvider';
import { Button } from '@/components/primitives';
import { StepCard } from '@/components/composites';
import { formatPenceRange, formatPence } from '@/utils/format-currency';

interface EstimateDisplayStepProps {
  step: EstimateDisplayStepConfig;
  isFirst: boolean;
  onFirstBack?: () => void;
}

/**
 * Renders the estimated price range with accept/adjust decision UI.
 *
 * "Continue to receive personalised quote" dispatches STEP_NEXT.
 * "Adjust my selections" dispatches STEP_GOTO with step.onAdjustGoTo.
 *
 * The STEP_GOTO guard in the FSM requires the target to have been visited
 * this session, which is guaranteed since the user passed through it to
 * reach the estimate display.
 */
export function EstimateDisplayStep({
  step,
  isFirst,
  onFirstBack,
}: EstimateDisplayStepProps): JSX.Element {
  const { state, dispatch } = useWizard();
  const store = useWizardStore();
  const config = store.getConfig();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const price = selectPrice(state, config);

  function handleContinue(): void {
    dispatch({ type: 'STEP_NEXT' });
  }

  function handleAdjust(): void {
    dispatch({ type: 'STEP_GOTO', stepId: step.onAdjustGoTo });
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
      <div className="space-y-6">
        {price.valid &&
        price.rangeMinPence !== null &&
        price.rangeMaxPence !== null &&
        price.totalPence !== null ? (
          <div
            className="rounded border border-border bg-surface-sunken p-6 text-center"
            aria-live="polite"
            aria-label="Price estimate"
          >
            <p className="text-sm font-medium text-text-muted">Estimated Price</p>
            <p className="mt-2 text-3xl font-semibold text-text">
              {step.showRangeAsRange
                ? formatPenceRange(price.rangeMinPence, price.rangeMaxPence)
                : formatPence(price.totalPence)}
            </p>
          </div>
        ) : (
          <div className="rounded border border-border bg-surface-sunken p-6 text-center">
            <p className="text-sm text-text-muted">
              Complete the previous steps to see your estimate.
            </p>
          </div>
        )}

        <p className="text-sm text-text-muted">{step.disclaimer}</p>

        <div className="flex flex-col gap-3">
          <Button type="button" variant="primary" onClick={handleContinue}>
            Continue to receive personalised quote
          </Button>
          <Button type="button" variant="secondary" onClick={handleAdjust}>
            Adjust my selections
          </Button>
        </div>

        <div className="mt-2">
          <Button type="button" variant="ghost" size="sm" onClick={handleBack}>
            Back
          </Button>
        </div>
      </div>
    </StepCard>
  );
}
