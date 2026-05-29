import { Skeleton } from '@/components/primitives';

/**
 * Shown during the submitting phase. Mirrors the success screen layout
 * using skeletons so the layout shift on success/failure is minimal.
 */
export function SubmittingScreen(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6" aria-live="polite" aria-label="Submitting your request">
      <div className="rounded border border-border bg-surface p-6 text-center">
        <Skeleton className="mx-auto mb-4 h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto mb-2 h-6 w-2/3" />
        <Skeleton className="mx-auto h-4 w-full" />
      </div>
    </div>
  );
}
