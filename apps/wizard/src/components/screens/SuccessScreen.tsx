function CheckCircleIcon(): JSX.Element {
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
      className="text-success"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M16 24l6 6 10-12" />
    </svg>
  );
}

interface SuccessScreenProps {
  submissionId: string | null;
  /**
   * True when the server flagged this submission as a duplicate of one made
   * in the last 24 hours (Step 5.13g, ADR-0028). Still a success — the
   * submission was saved — but the copy below is adjusted so the user
   * understands why they're not getting a fresh follow-up. Defaults to
   * false so existing callers/tests don't need updating.
   */
  isDuplicate?: boolean;
}

/** Terminal screen rendered after a successful submission. */
export function SuccessScreen({
  submissionId,
  isDuplicate = false,
}: SuccessScreenProps): JSX.Element {
  return (
    <div className="mx-auto max-w-xl p-6">
      <div className="rounded border border-border bg-surface p-6 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircleIcon />
        </div>
        <h1 className="text-xl font-semibold text-text">
          {isDuplicate ? 'We already have your request' : 'Quote request received'}
        </h1>
        <p className="mt-2 text-base text-text-muted">
          {isDuplicate
            ? 'We received a matching request from you recently. We will be in touch soon — no need to submit again.'
            : 'We will be in touch shortly with your personalised quote.'}
        </p>
        {submissionId !== null && (
          <p className="mt-4 text-sm text-text-subtle">Reference: {submissionId}</p>
        )}
      </div>
    </div>
  );
}
