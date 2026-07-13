/**
 * Per-session volatile store for bot-protection data (Step 5.13f).
 *
 * Mirrors PhotoStore (runtime/photos-store.ts) exactly: lives in a ref/useMemo
 * inside the component tree, resets on remount, and is NEVER persisted to
 * sessionStorage. The honeypot value and Turnstile token must not enter
 * WizardState — the FSM's persistence adapter serializes state.answers
 * wholesale, and neither of these values should ever be written to disk
 * (a Turnstile token is single-use and expires in ~5 minutes; the honeypot
 * value has no reason to survive a page reload).
 *
 * At submission time, createBotProtectionEnrichedPort (submission-bot-protection.ts)
 * reads this store and merges its values into the outgoing SubmissionRequest,
 * the same enrichment pattern createPhotoEnrichedPort uses for photo base64.
 */
export class BotProtectionStore {
  private honeypotValue = '';
  private turnstileToken: string | null = null;

  setHoneypotValue(value: string): void {
    this.honeypotValue = value;
  }

  getHoneypotValue(): string {
    return this.honeypotValue;
  }

  setTurnstileToken(token: string | null): void {
    this.turnstileToken = token;
  }

  getTurnstileToken(): string | null {
    return this.turnstileToken;
  }
}
