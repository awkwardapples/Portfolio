/**
 * Consent (spec Q.2; ported from the plugin's ConsentValidator, ADR-0029):
 * the data_processing_consent answer must be an array that contains
 * 'agreed'. Checked on the server so a request that skips the form cannot
 * skip it; nothing is stored without it.
 */
export const CONSENT_FIELD_KEY = 'data_processing_consent';
const CONSENT_VALUE = 'agreed';

export function isConsentGiven(answers: Readonly<Record<string, unknown>>): boolean {
  const answer = answers[CONSENT_FIELD_KEY];
  return Array.isArray(answer) && answer.includes(CONSENT_VALUE);
}
