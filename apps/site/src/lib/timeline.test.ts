import { describe, expect, it } from 'vitest';

import { inOrder, newestFirst, periodLabel, yearMonthLabel, type TimelineItem } from './timeline';

const item = (sortKey: string, title: string): TimelineItem => ({
  kind: 'work',
  key: `work:${title}`,
  sortKey,
  when: '',
  title,
  details: [],
});

describe('timeline', () => {
  it('labels months and periods in words', () => {
    expect(yearMonthLabel('2024-03')).toBe('March 2024');
    expect(yearMonthLabel('2024')).toBe('2024');
    expect(periodLabel('2021', '2025')).toBe('2021 to 2025');
    expect(periodLabel('2026', '2027', true)).toBe('2026 to 2027 (in progress)');
    expect(periodLabel('2024-03', undefined)).toBe('March 2024 to now');
    // A period within one year is that year alone (BEATLEASE, 2025).
    expect(periodLabel('2025', '2025')).toBe('2025');
  });

  it("follows Josh's order, oldest first, then anything unlisted by date", () => {
    const ordered = inOrder(
      [
        item('2026', 'MSc'),
        item('2021', 'BSc'),
        item('2023-10-08', 'Neural network'),
        item('2026-12-01', 'Later post'),
        item('2026-11-30', 'Another post'),
      ],
      ['work:Neural network', 'work:BSc', 'work:MSc', 'work:Gone'],
    );
    expect(ordered.map((entry) => entry.title)).toEqual([
      'Neural network',
      'BSc',
      'MSc',
      'Another post',
      'Later post',
    ]);
  });

  it('orders newest first across kinds', () => {
    const ordered = newestFirst([
      item('2021', 'BSc'),
      item('2025-08-11', 'Dissertation'),
      item('2026', 'MSc'),
      item('2023-10-08', 'Neural network'),
    ]);
    expect(ordered.map((entry) => entry.title)).toEqual([
      'MSc',
      'Dissertation',
      'Neural network',
      'BSc',
    ]);
  });
});
