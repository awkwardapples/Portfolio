import { describe, expect, it } from 'vitest';

import { THEME_CONTRACT } from '../theme-contract';

// Loaded at run time through a variable path, so the type checker does not
// pull tailwind.config.ts (outside this package's tsconfig) into the build.
const CONFIG_PATH = '../../../tailwind.config';
const config = (await import(/* @vite-ignore */ CONFIG_PATH)).default as {
  theme: Record<string, unknown>;
};

/**
 * The wizard's own Tailwind theme implements the theme contract, so every
 * token the components use exists here with SCB's value (spec U.4).
 */
describe('wizard tailwind theme implements the theme contract', () => {
  const theme = config.theme as Record<string, Record<string, unknown>>;
  const extend = (theme.extend ?? {}) as Record<string, Record<string, unknown>>;
  const section = (name: string) => ({ ...(theme[name] ?? {}), ...(extend[name] ?? {}) });

  it.each(
    Object.entries(THEME_CONTRACT).filter(([name]) => name !== 'neutral') as [
      string,
      readonly string[],
    ][],
  )('defines every %s token', (name, keys) => {
    const defined = section(name);
    expect(keys.filter((key) => !(key in defined))).toEqual([]);
  });

  it('defines the neutral steps the components use', () => {
    const neutral = section('colors').neutral as Record<string, string>;
    expect(THEME_CONTRACT.neutral.filter((step) => !(step in neutral))).toEqual([]);
  });
});
