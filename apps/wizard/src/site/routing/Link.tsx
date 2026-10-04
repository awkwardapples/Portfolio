import { type AnchorHTMLAttributes, type ReactNode, type MouseEvent, useCallback } from 'react';

import {
  NAVIGATE_EVENT,
  ROUTER_MODE,
  currentPath,
  memoryHref,
  navigate,
} from '@/site/routing/navigation';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly to: string;
  readonly children: ReactNode;
}

export { NAVIGATE_EVENT };

/**
 * Internal link component. Calls history.pushState on click and dispatches
 * a 'goqw:navigate' event that Router/SiteApp subscribe to.
 *
 * Modifier keys and middle-clicks are not intercepted — those open a new tab.
 * External links (http://, https://, mailto:) should use a plain <a>.
 */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.altKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }
      e.preventDefault();
      if (currentPath() !== to) navigate(to);
      onClick?.(e);
    },
    [to, onClick],
  );

  return (
    <a
      // In the framed demo, a link opened in a new tab opens the demo on that page.
      href={ROUTER_MODE === 'memory' ? memoryHref(import.meta.env.BASE_URL, to) : to}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
