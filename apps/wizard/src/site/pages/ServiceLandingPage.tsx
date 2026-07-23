import type { ReactElement } from 'react';
import { renderSection } from '@/site/sections/renderSection';
import type { ServicePageEntry } from '@/site/content/service-pages-content';

interface ServiceLandingPageProps {
  readonly page: ServicePageEntry;
}

/**
 * Single template for every SEO service landing page (Step 6.8). Renders one
 * page's `sections` array through the shared section-library renderer — the
 * exact same components HomePage uses. Content lives entirely in
 * service-pages-content.ts; this component owns no per-page copy.
 */
export function ServiceLandingPage({ page }: ServiceLandingPageProps): ReactElement {
  return <div>{page.sections.map((section) => renderSection(section))}</div>;
}
