import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * Runs axe against the page (or one part of it) and fails on any serious or
 * critical violation (spec R). Minor and moderate findings are printed.
 */
export async function expectNoSeriousViolations(page: Page, include?: string): Promise<void> {
  // After a click to another page, the cross-document view transition (global.css) covers the
  // new page while it runs, and axe would read every control as obscured: wait for it to end
  // (fixtures.ts records it as the page is revealed).
  await page.evaluate(() => (window as unknown as { __revealed?: Promise<void> }).__revealed);
  let builder = new AxeBuilder({ page }).withTags([
    'wcag2a',
    'wcag2aa',
    'wcag21a',
    'wcag21aa',
    'wcag22aa',
  ]);
  if (include) builder = builder.include(include);
  const { violations } = await builder.analyze();
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  for (const v of violations.filter((v) => !blocking.includes(v))) {
    console.log(`axe (${v.impact}): ${v.id}: ${v.help}`);
  }
  expect(
    blocking.map(
      (v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`,
    ),
  ).toEqual([]);
}
