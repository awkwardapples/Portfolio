import { useEffect, useState, type ReactElement } from 'react';
import { Router } from '@/site/routing/Router';
import { SiteShell } from '@/site/layout/SiteShell';
import { NAVIGATE_EVENT, currentPath, notifyParent } from '@/site/routing/navigation';

/**
 * Top-level site root. Owns the pathname state and navigation subscriptions.
 * Passes pathname to SiteShell (active nav styling) and Router (page match).
 */
export function SiteApp(): ReactElement {
  const [pathname, setPathname] = useState(() => currentPath());

  useEffect(() => {
    // The framed demo reports its first page too (portfolio ADR-0044).
    notifyParent();
    const update = () => setPathname(currentPath());
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
