import type { ReactElement } from 'react';
import { Link } from '@/site/routing/Link';
import { Nav } from '@/site/layout/Nav';
import { siteContent } from '@/site/content/site-content';

interface HeaderProps {
  readonly currentPath: string;
}

export function Header({ currentPath }: HeaderProps): ReactElement {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 p-4">
        <Link to="/" className="text-lg font-semibold text-text">
          {siteContent.businessName}
        </Link>
        <Nav currentPath={currentPath} />
      </div>
    </header>
  );
}
