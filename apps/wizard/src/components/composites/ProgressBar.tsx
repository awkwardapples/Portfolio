import { cn } from '@/design/cn';

interface ProgressBarProps {
  /** 1-based index of the current step. */
  current: number;
  /** Total number of visible steps. */
  total: number;
}

/**
 * Step progress indicator — one segment per step, filled by phase.
 * No inline styles: uses static Tailwind classes. Past steps dim, future pale.
 */
export function ProgressBar({ current, total }: ProgressBarProps): JSX.Element | null {
  if (total <= 0) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
      className="flex gap-1"
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        return (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              step < current
                ? 'bg-primary/50'
                : step === current
                  ? 'bg-primary'
                  : 'bg-surface-sunken',
            )}
          />
        );
      })}
    </div>
  );
}
