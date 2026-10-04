/**
 * The stored answer to "What brings you here?" (spec G.0, F.2), on every
 * page. It lives in this browser only and is never sent anywhere.
 *
 * "Choose again" (the intro) and "Change what brought you here" (the footer)
 * are links to /#threshold marked `data-choose-again`. Both forget the
 * answer. On the homepage the threshold comes back in place and focus moves
 * to its question; on other pages the link goes home, where the head script
 * now finds no answer and the threshold shows.
 */
import { INTENT_KEY } from '~/lib/intents';

export function rememberIntent(value: string): void {
  try {
    localStorage.setItem(INTENT_KEY, JSON.stringify({ value, at: new Date().toISOString() }));
  } catch {
    // Storage can be unavailable (private browsing); the choice still applies to this visit.
  }
}

export function forgetIntent(): void {
  try {
    localStorage.removeItem(INTENT_KEY);
  } catch {
    // Nothing stored.
  }
}

document.addEventListener('click', (event) => {
  const control = (event.target as Element).closest<HTMLElement>('[data-choose-again]');
  if (!control) return;
  forgetIntent();
  const threshold = document.querySelector<HTMLElement>('[data-threshold]');
  if (!threshold) return;
  event.preventDefault();
  delete document.documentElement.dataset.intent;
  window.scrollTo({ top: 0 });
  document.getElementById('threshold-question')?.focus({ preventScroll: true });
});
