/**
 * The threshold's behaviour (spec G.0, N.1): remember the answer in this
 * browser only, bring the house lights up, and land on the chosen section
 * with focus on its heading. Bringing the threshold back is in intent.ts,
 * because the footer offers it on every page.
 */
import { rememberIntent } from './intent';

const html = document.documentElement;
const threshold = document.querySelector<HTMLElement>('[data-threshold]');

/** Scroll to the section and move focus to its visible heading. */
function land(target: HTMLElement): void {
  const heading = Array.from(target.querySelectorAll<HTMLElement>('[data-landing]')).find(
    (element) => element.offsetParent !== null,
  );
  target.scrollIntoView({ block: 'start' });
  (heading ?? target).focus({ preventScroll: true });
}

function choose(option: HTMLAnchorElement): void {
  if (!threshold) return;
  const value = option.dataset.intentOption;
  const target = document.getElementById(option.hash.slice(1));
  if (!value || !target) return;
  rememberIntent(value);

  const finish = () => {
    html.dataset.intent = value;
    threshold.removeAttribute('data-choosing');
    threshold.removeAttribute('data-lights-up');
    option.removeAttribute('data-chosen');
    land(target);
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finish();
    return;
  }

  // The others fade (150 ms), then the lights come up (400 ms, or 250 ms on
  // phones): about 600 ms in all on wider screens, about 400 ms on phones (spec N.1).
  const short = window.matchMedia('(max-width: 639px)').matches;
  option.setAttribute('data-chosen', '');
  threshold.setAttribute('data-choosing', '');
  window.setTimeout(() => threshold.setAttribute('data-lights-up', ''), 150);
  window.setTimeout(
    () => {
      if (typeof document.startViewTransition === 'function') document.startViewTransition(finish);
      else finish();
    },
    short ? 400 : 600,
  );
}

threshold?.addEventListener('click', (event) => {
  const option = (event.target as Element).closest<HTMLAnchorElement>('a[data-intent-option]');
  if (!option) return;
  event.preventDefault();
  choose(option);
});
