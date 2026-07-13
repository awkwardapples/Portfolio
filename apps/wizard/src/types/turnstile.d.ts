/**
 * Ambient declaration for the Cloudflare Turnstile client SDK (Step 5.13f).
 *
 * The SDK is loaded dynamically by TurnstileWidget.tsx from
 * https://challenges.cloudflare.com/turnstile/v0/api.js — never bundled,
 * never present unless a deployment has configured a Turnstile site key.
 *
 * See AUDIT-5.13f-turnstile-api.md for the full client/server API reference.
 */

declare global {
  interface TurnstileRenderOptions {
    sitekey: string;
    callback?: (token: string) => void;
    'expired-callback'?: () => void;
    'error-callback'?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
  }

  interface TurnstileApi {
    render(container: HTMLElement, options: TurnstileRenderOptions): string;
    reset(widgetId?: string): void;
    remove(widgetId: string): void;
  }

  interface Window {
    /** Present once the Turnstile SDK script has loaded. */
    turnstile?: TurnstileApi;
  }
}

// Required so TS treats this file as a module rather than a script.
export {};
