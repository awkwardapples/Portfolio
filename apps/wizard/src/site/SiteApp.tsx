import { useEffect, useState, type ReactElement } from 'react';
import { Router } from '@/site/routing/Router';
import { SiteShell } from '@/site/layout/SiteShell';
import { NAVIGATE_EVENT } from '@/site/routing/Link';

/**
 * Top-level site root. Owns the pathname state and navigation subscriptions.
 * Passes pathname to SiteShell (active nav styling) and Router (page match).
 */
export function SiteApp(): ReactElement {
  const [pathname, setPathname] = useState(() =>
    typeof window === 'undefined' ? '/' : window.location.pathname,
  );

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener(NAVIGATE_EVENT, update);
    window.addEventListener('popstate', update);
    return () => {
      window.removeEventListener(NAVIGATE_EVENT, update);
      window.removeEventListener('popstate', update);
    };
  }, []);

  return (
    <SiteShell currentPath={pathname}>
      <Router pathname={pathname} />
    </SiteShell>
  );
}
