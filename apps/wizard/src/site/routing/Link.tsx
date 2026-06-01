import { type AnchorHTMLAttributes, type ReactNode, type MouseEvent, useCallback } from 'react';

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly to: string;
  readonly children: ReactNode;
}

export const NAVIGATE_EVENT = 'goqw:navigate';

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
      if (window.location.pathname !== to) {
        window.history.pushState({}, '', to);
        window.dispatchEvent(new Event(NAVIGATE_EVENT));
        window.scrollTo(0, 0);
      }
      onClick?.(e);
    },
    [to, onClick],
  );

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
