import { fileURLToPath } from 'node:url';

import postcss from 'postcss';
import tailwindcss, { type Config } from 'tailwindcss';
import { describe, expect, it } from 'vitest';

/**
 * Spec U.4: compile Tailwind over the wizard's reusable components twice,
 * with the wizard's own theme (SCB) and with the portfolio's, and fail if a
 * class that produces CSS under the wizard's theme produces none under the
 * portfolio's. That is exactly the case of a token missing from the site's
 * theme, which Tailwind would otherwise skip silently.
 */

const COMPONENTS = fileURLToPath(
  new URL('../../../wizard/src/components/**/*.{ts,tsx}', import.meta.url),
);

// Loaded through variable paths so the type checker does not follow them.
const WIZARD_CONFIG = '../../../wizard/tailwind.config';
const SITE_CONFIG = '../../tailwind.config';

async function classesBuiltWith(configPath: string): Promise<Set<string>> {
  const config = (await import(/* @vite-ignore */ configPath)).default as Config;
  const result = await postcss([
    tailwindcss({ ...config, content: [COMPONENTS], corePlugins: { preflight: false } }),
  ]).process('@tailwind components; @tailwind utilities;', { from: undefined });
  // Class names come from rule selectors only, never from values such as `0.06`.
  const classes = new Set<string>();
  result.root.walkRules((rule) => {
    for (const match of rule.selector.matchAll(/\.((?:\\.|[A-Za-z0-9_-])+)/g)) {
      classes.add(match[1]!.replace(/\\(.)/g, '$1'));
    }
  });
  return classes;
}

describe('theme contract (spec U.4)', () => {
  it('every class the wizard components use produces CSS under the portfolio theme', async () => {
    const [wizard, site] = await Promise.all([
      classesBuiltWith(WIZARD_CONFIG),
      classesBuiltWith(SITE_CONFIG),
    ]);
    expect(wizard.size).toBeGreaterThan(100);
    const missing = [...wizard].filter((name) => !site.has(name)).sort();
    expect(missing).toEqual([]);
  });
});
