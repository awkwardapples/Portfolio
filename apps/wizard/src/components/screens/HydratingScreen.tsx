import { Skeleton } from '@/components/primitives';

/**
 * Shown during idle/hydrating phase while the store initialises.
 * Uses skeletons that mirror the real step layout — no spinner.
 */
export function HydratingScreen(): JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6">
      <Skeleton className="mb-2 h-1 w-full" />
      <div className="mt-4 rounded border border-border bg-surface p-6">
        <Skeleton className="mb-4 h-6 w-2/3" />
        <Skeleton className="mb-6 h-4 w-full" />
        <div className="space-y-6">
          <div className="space-y-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
    </div>
  );
}
