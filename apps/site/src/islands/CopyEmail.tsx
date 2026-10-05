import { useEffect, useRef, useState, type ReactElement } from 'react';

import { buttonClass, type ButtonSurface } from '~/design/button';

interface CopyEmailProps {
  email: string;
  surface?: ButtonSurface;
}

type CopyState = 'idle' | 'copied' | 'failed';

/**
 * The email address with a copy button (spec N.13). The label changes to
 * "Copied" straight away, a polite live region announces it, and it reverts
 * after two seconds. If the clipboard is unavailable, the address is
 * selected and the visitor is told to press Ctrl+C. The address itself is a
 * mailto link, so it works before this hydrates and without JavaScript.
 * The button has a visible label, so it needs no tooltip (one would also
 * hang past the edge of a phone screen).
 */
export function CopyEmail({ email, surface = 'stage' }: CopyEmailProps): ReactElement {
  const [state, setState] = useState<CopyState>('idle');
  const addressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (state !== 'copied') return;
    const timer = window.setTimeout(() => setState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [state]);

  async function copy(): Promise<void> {
    setState('copied');
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      setState('failed');
      if (addressRef.current) window.getSelection()?.selectAllChildren(addressRef.current);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center underline">
        <span ref={addressRef}>{email}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label={state === 'copied' ? 'Copied' : 'Copy the email address'}
        className={buttonClass({ variant: 'secondary', surface, size: 'compact' })}
      >
        {state === 'copied' ? 'Copied' : 'Copy'}
      </button>
      {state === 'failed' && <span className="text-xs">Press Ctrl+C to copy</span>}
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied'
          ? 'Email address copied'
          : state === 'failed'
            ? 'Press Ctrl+C to copy'
            : ''}
      </span>
    </span>
  );
}
