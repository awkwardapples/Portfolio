import { useEffect, useState, type ComponentType, type ReactElement } from 'react';

import type { ContactWizardProps } from './ContactWizard';

type State =
  | { status: 'loading' }
  | { status: 'ready'; Wizard: ComponentType<ContactWizardProps> }
  | { status: 'failed' };

/**
 * The contact wizard, fetched once the page has loaded (spec I.2, P.1, P.2;
 * ADR-0048). The page hydrates this with `client:afterload`, so the server
 * renders the skeleton (in the shape of the wizard's first screen, so nothing
 * shifts) and no wizard JavaScript, React included, is requested until the
 * page's load event: it never competes with the heading and text that paint
 * first. The wizard itself still never runs on the server.
 */
export function DeferredContactWizard(props: ContactWizardProps): ReactElement {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    import('./ContactWizard').then(
      (module) => active && setState({ status: 'ready', Wizard: module.ContactWizard }),
      () => active && setState({ status: 'failed' }),
    );
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'ready') return <state.Wizard {...props} />;
  if (state.status === 'failed') {
    return (
      <p role="alert" className="rounded border border-rule bg-paper p-6">
        The questions did not load. Reload the page to try again, or use the email address below.
      </p>
    );
  }
  return (
    <div aria-hidden="true" className="rounded border border-rule bg-paper p-6">
      <div className="h-6 w-2/3 animate-goqw-pulse rounded bg-paper-sunken" />
      <div className="mt-6 flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="h-16 animate-goqw-pulse rounded border border-rule bg-paper-sunken"
          />
        ))}
      </div>
    </div>
  );
}
