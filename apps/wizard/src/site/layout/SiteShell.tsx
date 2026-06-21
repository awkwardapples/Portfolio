import type { ReactNode, ReactElement } from 'react';
import { Header } from '@/site/layout/Header';
import { Footer } from '@/site/Footer';
import { footerContent } from '@/site/pages/footer-content';
import { SkipLink } from '@/site/layout/SkipLink';

interface SiteShellProps {
  readonly currentPath: string;
  readonly children: ReactNode;
}

/**
 * The shared layout wrapping every page. Renders skip link, header (with nav),
 * <main id="main">, and footer. SiteApp passes currentPath and the Router
 * output as children.
 */
export function SiteShell({ currentPath, children }: SiteShellProps): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SkipLink />
      <Header currentPath={currentPath} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer content={footerContent} />
    </div>
  );
}
