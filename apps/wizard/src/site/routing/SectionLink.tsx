import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link } from '@/site/routing/Link';

interface SectionLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  readonly href: string;
  readonly children: ReactNode;
}

/**
 * Returns true for internal site paths (starting with '/').
 * External schemes (tel:, mailto:, https://, etc.) return false.
 * Exported for unit testing.
 */
export function isInternalLink(href: string): boolean {
  return href.startsWith('/');
}

/**
 * Link helper for section components.
 *
 * Internal hrefs (starting with /) use the site router's Link for
 * client-side navigation. External hrefs use a plain <a> so the
 * browser handles tel:, mailto:, and https:// links natively.
 *
 * Per ADR-0020 amendment (5.7-remediation).
 */
export function SectionLink({ href, children, ...rest }: SectionLinkProps) {
  if (isInternalLink(href)) {
    return (
      <Link to={href} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export default SectionLink;
