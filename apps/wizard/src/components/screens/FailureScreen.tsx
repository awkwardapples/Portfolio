import { Button } from '@/components/primitives';
import { useWizardCopy } from '@/runtime/copy';
import type { SubmissionErrorInfo } from '@/domain/runtime/state';

function AlertCircleIcon(): JSX.Element {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-danger"
    >
      <circle cx="24" cy="24" r="20" />
      <line x1="24" y1="16" x2="24" y2="26" />
      <circle cx="24" cy="33" r="1" fill="currentColor" />
    </svg>
  );
}

interface FailureScreenProps {
  error: SubmissionErrorInfo | null;
  onRetry: () => void;
}

/** Terminal (but retryable) screen rendered after a submission failure. */
export function FailureScreen({ error, onRetry }: FailureScreenProps): JSX.Element {
  const canRetry = error?.retryable ?? true;
  const referenceId = error?.submissionId;
  const isRateLimited = error?.code === 'rate_limited';
  const copy = useWizardCopy();
  const Heading = copy.screenHeadingLevel;

  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded border border-border bg-surface p-6 text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircleIcon />
        </div>
        <Heading className="text-xl font-semibold text-text">
          {isRateLimited ? copy.rateLimitedTitle : copy.failureTitle}
        </Heading>
        <p className="mt-2 text-base text-text-muted">{error?.message ?? copy.failureFallback}</p>
        {referenceId !== undefined && referenceId !== null && (
          <p className="mt-3 text-sm text-text-subtle">
            {copy.referenceLabel}: {referenceId}
          </p>
        )}
        {canRetry && (
          <div className="mt-6 flex justify-center">
            <Button variant="primary" onClick={onRetry}>
              {copy.retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
