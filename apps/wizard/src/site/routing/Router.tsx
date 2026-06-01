import { type ReactElement, useEffect } from 'react';
import { matchRoute } from '@/site/routing/routes';

interface RouterProps {
  readonly pathname: string;
}

/**
 * Minimal router. Pure function of pathname — SiteApp owns the state and
 * navigation event subscriptions. Matches pathname against the static route
 * table, renders the matched page's element, and updates document.title.
 */
export function Router({ pathname }: RouterProps): ReactElement {
  const route = matchRoute(pathname);

  useEffect(() => {
    document.title = route.title;
  }, [route.title]);

  return route.element();
}
