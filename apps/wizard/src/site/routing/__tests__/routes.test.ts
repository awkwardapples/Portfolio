import { describe, it, expect } from 'vitest';
import { ROUTES, DEFAULT_ROUTE, matchRoute } from '@/site/routing/routes';

describe('route table', () => {
  it('contains exactly six routes', () => {
    expect(ROUTES).toHaveLength(6);
  });

  it('every route has a non-empty path, title, navLabel, and element factory', () => {
    for (const r of ROUTES) {
      expect(r.path.length).toBeGreaterThan(0);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.navLabel.length).toBeGreaterThan(0);
      expect(typeof r.element).toBe('function');
    }
  });

  it('route paths are unique', () => {
    const paths = ROUTES.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('includes the root route', () => {
    expect(ROUTES.find((r) => r.path === '/')).toBeDefined();
  });

  it('DEFAULT_ROUTE is the home route', () => {
    expect(DEFAULT_ROUTE.path).toBe('/');
  });

  it('/privacy is excluded from primary nav (showInNav: false)', () => {
    const privacy = ROUTES.find((r) => r.path === '/privacy');
    expect(privacy?.showInNav).toBe(false);
  });

  it('every other route defaults to visible in nav (showInNav is not false)', () => {
    for (const r of ROUTES.filter((r) => r.path !== '/privacy')) {
      expect(r.showInNav).not.toBe(false);
    }
  });
});

describe('matchRoute', () => {
  it.each([
    ['/', '/'],
    ['/services', '/services'],
    ['/our-work', '/our-work'],
    ['/contact', '/contact'],
    ['/quote', '/quote'],
    ['/privacy', '/privacy'],
  ])('matches %s to %s', (input, expected) => {
    expect(matchRoute(input).path).toBe(expected);
  });

  it('normalises trailing slash (except on root)', () => {
    expect(matchRoute('/services/').path).toBe('/services');
  });

  it('preserves root pathname exactly', () => {
    expect(matchRoute('/').path).toBe('/');
  });

  it('falls back to the default route for unknown paths', () => {
    expect(matchRoute('/unknown').path).toBe('/');
    expect(matchRoute('/services/sub').path).toBe('/');
  });
});
