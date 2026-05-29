import { Button } from '@/components/primitives';

interface NavigationControlsProps {
  onBack: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

/** Back / Next (or Submit) button row for a wizard step. */
export function NavigationControls({
  onBack,
  onNext,
  isFirst,
  isLast,
}: NavigationControlsProps): JSX.Element {
  return (
    <div className="mt-6 flex items-center justify-between">
      {isFirst ? (
        <div aria-hidden="true" />
      ) : (
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      )}
      <Button type="submit" variant="primary" onClick={onNext}>
        {isLast ? 'Submit' : 'Next'}
      </Button>
    </div>
  );
}
