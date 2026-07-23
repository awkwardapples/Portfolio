/**
 * Whether a step's submission-triggering controls (the primary Submit
 * button and, when present, "Skip and Submit") should be disabled.
 *
 * Step 6.7: both buttons dispatch the identical SUBMIT_REQUESTED action
 * (StepRenderer's handleNext and handleSkip), so both must be blocked by
 * the same conditions. Extracted to one function — rather than each call
 * site recomputing `hasMissingPhotos || !turnstileReady` independently —
 * specifically so a future third submit-triggering control can't
 * reintroduce this bug by drifting out of sync with the other two.
 *
 * Pure and framework-free so it can be unit-tested directly: this
 * codebase's Vitest config runs in the `node` environment with no DOM
 * (see vitest.config.ts), so component-level "is the button disabled"
 * tests aren't possible here — this function is the part of the fix that
 * can carry real automated coverage.
 */
export function isSubmissionBlocked(params: {
  hasMissingPhotos: boolean;
  turnstileReady: boolean;
}): boolean {
  return params.hasMissingPhotos || !params.turnstileReady;
}
