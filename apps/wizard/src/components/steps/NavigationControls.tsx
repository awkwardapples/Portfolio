import { Button } from '@/components/primitives';

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isLast: boolean;
  /** Disable the primary action button. Used on the submit step when photos need re-attaching. */
  disabled?: boolean;
}

/** Back / Next (or Submit) button row for a wizard step. */
export function NavigationControls({
  onBack,
  onNext,
  isLast,
  disabled = false,
}: NavigationControlsProps): JSX.Element {
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button type="button" variant="secondary" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" variant="primary" onClick={onNext} disabled={disabled}>
        {isLast ? 'Submit' : 'Next'}
      </Button>
    </div>
  );
}
