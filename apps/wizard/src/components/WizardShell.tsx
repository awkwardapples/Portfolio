import { buildFieldKeyMap } from '@/domain/runtime/condition-evaluator';
import { getVisibleSteps } from '@/domain/runtime/navigation';
import { getMergedWizard } from '@/domain/runtime/transition';
import { selectPrice } from '@/domain/pricing';
import { useWizard } from '@/runtime/useWizard';
import { useWizardStore } from '@/runtime/WizardProvider';
import { PriceSummary, ProgressBar } from '@/components/composites';
import {
  FailureScreen,
  HydratingScreen,
  SubmittingScreen,
  SuccessScreen,
} from '@/components/screens';
import { StepRenderer } from '@/components/steps';

interface WizardShellProps {
  /** Called when the user presses Back on the first wizard step. */
  onReturnToSelector?: () => void;
}

/**
 * Top-level phase switcher. Maps WizardPhase to the appropriate screen.
 *
 * Re-renders on every store dispatch; inner components use key={step.id} so
 * their local state resets cleanly on step change.
 */
export function WizardShell({ onReturnToSelector }: WizardShellProps = {}): JSX.Element {
  const { state, dispatch } = useWizard();
  const store = useWizardStore();
  const config = store.getConfig();

  const { phase } = state;

  if (phase === 'idle' || phase === 'hydrating') {
    return <HydratingScreen />;
  }

  if (phase === 'submitting') {
    return <SubmittingScreen />;
  }

  if (phase === 'submit_success') {
    const submissionId =
      state.submissionResult?.outcome === 'success' ? state.submissionResult.submissionId : null;
    return <SuccessScreen submissionId={submissionId} />;
  }

  if (phase === 'submit_failure') {
    const error =
      state.submissionResult?.outcome === 'failure' ? state.submissionResult.error : null;
    return <FailureScreen error={error} onRetry={() => dispatch({ type: 'SUBMIT_RETRY' })} />;
  }

  // phase === 'answering' | 'validating'
  const wizard = getMergedWizard(config);
  const fieldKeyById = buildFieldKeyMap(wizard);
  const visibleSteps = getVisibleSteps(wizard, state.answers, fieldKeyById);
  const currentStep = visibleSteps.find((s) => s.id === state.currentStepId);

  if (currentStep === undefined) {
    // Defensive: should not occur when machine is in answering/validating phase.
    return <HydratingScreen />;
  }

  const currentIndex = visibleSteps.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === visibleSteps.length - 1;

  const quoteMode = wizard.quoteMode ?? 'instant';
  const price = quoteMode === 'instant' ? selectPrice(state, config) : null;

  return (
    <>
      <a
        href="#wizard-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-2 focus:text-text focus:shadow-elevated"
      >
        Skip to main content
      </a>
      <main id="wizard-main" className="mx-auto max-w-xl space-y-4 p-6">
        <ProgressBar current={currentIndex + 1} total={visibleSteps.length} />
        <StepRenderer
          key={currentStep.id}
          step={currentStep}
          isFirst={isFirst}
          isLast={isLast}
          onFirstBack={onReturnToSelector}
        />
        {price !== null &&
          price.valid &&
          price.totalPence !== null &&
          price.rangeMinPence !== null &&
          price.rangeMaxPence !== null && (
            <PriceSummary
              totalPence={price.totalPence}
              rangeMinPence={price.rangeMinPence}
              rangeMaxPence={price.rangeMaxPence}
            />
          )}
      </main>
    </>
  );
}
