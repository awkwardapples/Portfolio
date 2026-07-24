import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/design/cn';

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Shared outer wrapper for simple, prose-driven inner pages (Contact,
 * Privacy Policy, Our Work, Services directory) — extracted (Phase 11) after
 * the identical `mx-auto max-w-3xl px-6 py-12` string was hand-duplicated
 * across all four page files. Deliberately narrower than the `max-w-5xl`
 * section-library container: these pages are a single reading column, not a
 * space-filling marketing section, so a tighter prose measure is the correct
 * choice here, not an inconsistency to reconcile away.
 *
 * Not used by the home page, service landing pages, or the quote wizard —
 * those compose the section library (`max-w-5xl` per section) or the
 * protected wizard shell respectively, both already consistent on their own
 * terms.
 */
export function PageContainer({ children, className, ...rest }: PageContainerProps) {
  return (
    <div className={cn('mx-auto max-w-3xl px-6 py-12', className)} {...rest}>
      {children}
    </div>
  );
}
