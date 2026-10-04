import type { ReactNode, ReactElement } from 'react';
import { Header } from '@/site/layout/Header';
import { Footer } from '@/site/Footer';
import { footerContent } from '@/site/pages/footer-content';
import { SkipLink } from '@/site/layout/SkipLink';
import { DemoBanner } from '@/site/layout/DemoBanner';
import { IS_DEMO } from '@/site/demo';

interface SiteShellProps {
  readonly currentPath: string;
  readonly children: ReactNode;
}

/**
 * The shared layout wrapping every page. Renders skip link, header (with nav),
 * <main id="main">, and footer. SiteApp passes currentPath and the Router
 * output as children.
 *
 * `bg-surface-dark` (Phase 13 — Final Dark Theme Consistency Pass): this is
 * the one shared wrapper behind every route — home, service pages, and the
 * simple inner pages (Contact/Services/Our Work/Privacy/Quote) alike. It was
 * still `bg-surface` (white) after Phase 12, which was invisible on
 * home/service pages (every section already paints its own full-width dark
 * background over it) but had two real, visible consequences: a sliver of
 * white showing through Footer's own `mt-12` gap above its border, and every
 * inner page — which has no section-level background of its own, just
 * `PageContainer` content directly inside this wrapper — rendering fully
 * white. Fixing it here, once, is what makes every route consistently dark
 * without adding a background to `PageContainer` or any individual page.
 */
export function SiteShell({ currentPath, children }: SiteShellProps): ReactElement {
  return (
    <div className={`flex min-h-screen flex-col bg-surface-dark${IS_DEMO ? ' pb-10' : ''}`}>
      <SkipLink />
      <Header currentPath={currentPath} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer content={footerContent} />
      {IS_DEMO && <DemoBanner />}
    </div>
  );
}
