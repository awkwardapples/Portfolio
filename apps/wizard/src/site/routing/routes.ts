/**
 * Static route table. The single source of truth for which routes exist.
 *
 * Each entry declares a path, document title, nav label, and an element
 * factory. Adding a route = adding one entry here + one page component.
 *
 * Element factories use createElement (not JSX) so this file can stay .ts.
 */

import { createElement, type ReactElement } from 'react';
import { HomePage } from '@/site/pages/HomePage';
import { ServicesPage } from '@/site/pages/ServicesPage';
import { OurWorkPage } from '@/site/pages/OurWorkPage';
import { ContactPage } from '@/site/pages/ContactPage';
import { QuotePage } from '@/site/pages/QuotePage';
import { PrivacyPolicyPage } from '@/site/pages/PrivacyPolicyPage';

export interface RouteEntry {
  readonly path: string;
  readonly title: string;
  readonly navLabel: string;
  readonly element: () => ReactElement;
  /**
   * Whether this route appears as a link in the primary site navigation
   * (Nav.tsx). Defaults to true when omitted. Legal/policy routes (e.g.
   * /privacy) are reachable via the footer's legalLinks instead and should
   * not clutter the primary nav.
   */
  readonly showInNav?: boolean;
}

export const ROUTES: readonly RouteEntry[] = [
  { path: '/', title: 'Home', navLabel: 'Home', element: () => createElement(HomePage) },
  {
    path: '/services',
    title: 'Services',
    navLabel: 'Services',
    element: () => createElement(ServicesPage),
  },
  {
    path: '/our-work',
    title: 'Our work',
    navLabel: 'Our work',
    element: () => createElement(OurWorkPage),
  },
  {
    path: '/contact',
    title: 'Contact',
    navLabel: 'Contact',
    element: () => createElement(ContactPage),
  },
  {
    path: '/quote',
    title: 'Get a quote',
    navLabel: 'Get a free quote',
    element: () => createElement(QuotePage),
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    navLabel: 'Privacy Policy',
    element: () => createElement(PrivacyPolicyPage),
    showInNav: false,
  },
] as const;

/**
 * Default route when pathname does not match — falls back to Home.
 * Unknown paths render the home page (not a 404) per ADR-0016.
 */
export const DEFAULT_ROUTE: RouteEntry = ROUTES[0]!;

/**
 * Pure matcher: given a pathname, return the matching route or DEFAULT_ROUTE.
 * Exact match only — no wildcards, no params, no regex.
 * Normalises trailing slash (except root).
 */
export function matchRoute(pathname: string): RouteEntry {
  const normalized = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return ROUTES.find((r) => r.path === normalized) ?? DEFAULT_ROUTE;
}
