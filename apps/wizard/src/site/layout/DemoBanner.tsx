import type { ReactElement } from 'react';

import { DEMO_NOTICE } from '@/site/demo';

/**
 * A slim notice that stays on screen throughout the demo (portfolio spec
 * J.3). It sits at the bottom of the viewport, so it never covers the SCB
 * header, and the shell pads its content by the same height.
 */
export function DemoBanner(): ReactElement {
  return (
    <p
      role="note"
      className="fixed inset-x-0 bottom-0 z-50 bg-primary px-4 py-2 text-center text-sm font-medium text-text-inverse"
    >
      {DEMO_NOTICE}
    </p>
  );
}
