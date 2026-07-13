import { useEffect, useRef } from 'react';

import { config } from '@/config-loader';
import { useBotProtectionStore } from '@/runtime/hooks/useBotProtectionStore';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Loads the Cloudflare Turnstile SDK at most once per page, regardless of
 * how many TurnstileWidget instances mount. Resolves immediately if
 * window.turnstile already exists (script already loaded) or if called in
 * a non-browser context (SSR/tests).
 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }
  if (window.turnstile) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${TURNSTILE_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('Turnstile script failed to load')),
      );
      return;
    }

    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('Turnstile script failed to load')));
    document.head.appendChild(script);
  });
}

interface TurnstileWidgetProps {
  /**
   * Called whenever the token changes (issued, expired, or errored to null).
   * StepRenderer uses this to gate the Submit button until a token exists —
   * BotProtectionStore itself is a plain class, not reactive React state, so
   * this callback is how the token-ready fact reaches the component tree.
   */
  onTokenChange?: (token: string | null) => void;
}

/**
 * Renders the Cloudflare Turnstile widget on the final wizard step (Step
 * 5.13f, ADR-0027). Renders nothing when config.turnstileSiteKey is empty —
 * Turnstile is not configured for this deployment, and BotProtection's
 * server-side check skips Layer 3 entirely in that case.
 *
 * Mounted only when the parent (StepRenderer, gated on isLast) shows the
 * final step, so the token's ~5-minute lifetime doesn't start counting down
 * before the user gets there. Going Back then forward again remounts this
 * component and requests a fresh token — correct behaviour, not a bug.
 *
 * Not unit-tested: this codebase has no React component tests anywhere
 * (vitest.config.ts runs the domain/runtime suite in the `node` environment
 * with no DOM) — component behaviour is verified operationally, the same
 * convention every other component in src/components/ already follows.
 */
export function TurnstileWidget({ onTokenChange }: TurnstileWidgetProps = {}): JSX.Element | null {
  const store = useBotProtectionStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (config.turnstileSiteKey === '' || containerRef.current === null) {
      return;
    }

    let cancelled = false;

    const setToken = (token: string | null): void => {
      store?.setTurnstileToken(token);
      onTokenChange?.(token);
    };

    loadTurnstileScript()
      .then(() => {
        if (cancelled || containerRef.current === null || !window.turnstile) {
          return;
        }
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: config.turnstileSiteKey,
          callback: (token: string) => setToken(token),
          'expired-callback': () => setToken(null),
          'error-callback': () => setToken(null),
        });
      })
      .catch(() => {
        // Widget failed to load: leave the token null. Submission stays
        // gated by NavigationControls until a token is issued (fail closed).
        setToken(null);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [store, onTokenChange]);

  if (config.turnstileSiteKey === '') {
    return null;
  }

  return <div ref={containerRef} className="mt-4" />;
}
