import { describe, expect, it } from 'vitest';

import { contrastRatio } from './contrast';
import { contrastPairs, palette, wizardColors } from './tokens';

describe('contrast ratio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
});

describe('palette pairs used for text and controls (spec R)', () => {
  it.each(contrastPairs.map((pair) => [pair.use, pair] as const))('%s', (_use, pair) => {
    const ratio = contrastRatio(palette[pair.foreground], palette[pair.background]);
    expect(ratio).toBeGreaterThanOrEqual(pair.minimum);
  });
});

describe('the ratios spec E.2 states', () => {
  it.each([
    ['ink on paper', 'ink', 'paper', 19.0],
    ['graphite on paper', 'graphite', 'paper', 6.2],
    ['fog on stage', 'fog', 'stage', 8.8],
    ['tungsten on stage', 'tungsten', 'stage', 11.5],
    ['black on tungsten', 'ink', 'tungsten', 11.5],
    ['tungsten-deep on paper', 'tungsten-deep', 'paper', 5.4],
  ] as const)('%s is about %d:1', (_name, fg, bg, stated) => {
    expect(contrastRatio(palette[fg], palette[bg])).toBeCloseTo(stated, 0);
  });

  it('keeps tungsten off paper as text (about 1.7:1)', () => {
    expect(contrastRatio(palette.tungsten, palette.paper)).toBeLessThan(3);
  });

  it('keeps state colours off stage (below 4.5:1 there)', () => {
    expect(contrastRatio(palette.danger, palette.stage)).toBeLessThan(4.5);
  });
});

describe('the wizard components under the portfolio theme', () => {
  it.each([
    ['primary button text', wizardColors['text-inverse'], wizardColors.primary],
    ['destructive button text', wizardColors['text-inverse'], wizardColors.danger],
    ['tooltip text', wizardColors['text-inverse'], wizardColors.neutral[800]],
    ['body text', wizardColors.text, wizardColors.surface],
    ['muted text', wizardColors['text-muted'], wizardColors.surface],
    ['muted text on sunken surfaces', wizardColors['text-muted'], wizardColors['surface-sunken']],
    ['subtle text', wizardColors['text-subtle'], wizardColors.surface],
    ['validation text', wizardColors.danger, wizardColors.surface],
  ])('%s reaches 4.5:1', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('input borders reach 3:1', () => {
    expect(
      contrastRatio(wizardColors['border-strong'], wizardColors.surface),
    ).toBeGreaterThanOrEqual(3);
  });
});
