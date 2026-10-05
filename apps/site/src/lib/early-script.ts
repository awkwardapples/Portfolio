/**
 * The one script that runs before the first paint (spec G.0). It marks that
 * JavaScript runs (html.js, for .js-only and .no-js-only) and, if this
 * browser has answered "What brings you here?", sets html[data-intent] so the
 * threshold stays hidden and the intro shows the right calls to action. The
 * answer never leaves the browser.
 *
 * It lives here rather than in the layout because the Content Security
 * Policy needs its exact text: Astro hashes the scripts it bundles but not
 * `is:inline` ones, so astro.config.mjs hashes this string itself (ADR-0048).
 */
import { INTENT_KEY, INTENTS } from './intents';

const answers = INTENTS.map((intent) => intent.value).join('|');

export const EARLY_SCRIPT = `document.documentElement.classList.add('js');
try {
  var stored = JSON.parse(localStorage.getItem('${INTENT_KEY}') || 'null');
  if (stored && /^(${answers})$/.test(stored.value)) {
    document.documentElement.dataset.intent = stored.value;
  }
} catch (error) {}`;
