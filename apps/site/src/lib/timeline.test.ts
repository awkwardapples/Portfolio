import { describe, expect, it } from 'vitest';

import { newestFirst, periodLabel, yearMonthLabel, type TimelineItem } from './timeline';

const item = (sortKey: string, title: string): TimelineItem => ({
  kind: 'work',
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
