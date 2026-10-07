import { expect, test as base } from '@playwright/test';

/**
 * Every browser test runs under the site's enforced Content Security Policy
 * (spec Q.4, ADR-0048) and fails if a page of this site reports a violation,
 * so every route and every flow the suite exercises is also a CSP test.
 * Violations inside other sites' frames (a YouTube player, a blank page that
 * tries to frame the demo) belong to them and are ignored.
 *
 * Video files are not served to the tests: the footage loop streams whenever
 * it scrolls into view, no test needs it, and many parallel streams from
 * wrangler dev's local asset server dropped its connection mid-run (the
 * loop's poster still shows).
 */
export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    const origin = new URL(baseURL ?? '').origin;
    await page.route(/\/media\/video\/[^?]+\.mp4(\?|$)/, (route) => route.abort());
    const violations: string[] = [];
    await page.exposeBinding('__reportCspViolation', ({ frame }, report: string) => {
      const url = frame.url();
      if (url.startsWith(origin)) violations.push(`${url}: ${report}`);
    });
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        const report = (window as unknown as { __reportCspViolation(report: string): void })
          .__reportCspViolation;
        report(
          `${event.effectiveDirective} blocked ${event.blockedURI || 'inline'} at ${event.sourceFile || 'the document'}:${event.lineNumber}`,
        );
      });
    });
    await use(page);
    expect(violations, 'Content Security Policy violations').toEqual([]);
  },
});

export { expect };
