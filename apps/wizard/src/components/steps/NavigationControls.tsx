import { Button } from '@/components/primitives';
import { useWizardCopy } from '@/runtime/copy';

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  /**
   * Disable every submission-triggering button in this row — the primary
   * action and, when present, "Skip and Submit" (Step 6.7). Both dispatch
   * the same submit action, so both must respect the same gate (missing
   * photos needing re-attachment, Turnstile not yet ready).
   */
  disabled?: boolean;
  /** When provided, renders a "Skip and Submit" button between Back and the primary action. */
  onSkip?: () => void;
}

/** Back / Next (or Submit) button row for a wizard step. */
export function NavigationControls({
  onBack,
  onNext,
  isLast,
  disabled = false,
  onSkip,
}: NavigationControlsProps): JSX.Element {
  const copy = useWizardCopy();
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button type="button" variant="secondary" onClick={onBack}>
        {copy.backLabel}
      </Button>
      {onSkip && (
        <Button type="button" variant="secondary" onClick={onSkip} disabled={disabled}>
          {copy.skipAndSubmitLabel}
        </Button>
      )}
      <Button type="submit" variant="primary" onClick={onNext} disabled={disabled}>
        {isLast ? copy.submitLabel : copy.nextLabel}
      </Button>
    </div>
  );
}
