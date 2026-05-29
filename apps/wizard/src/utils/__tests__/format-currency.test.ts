import { describe, expect, it } from 'vitest';

import { formatPence, formatPenceRange } from '../format-currency';

describe('formatPence', () => {
  it('formats whole pounds', () => {
    expect(formatPence(32500)).toBe('£325');
  });

  it('rounds sub-pence fractions (should not occur — inputs are integer pence)', () => {
    // 50p → £0 (rounds to nearest pound, minimumFractionDigits: 0)
    expect(formatPence(50)).toBe('£1');
  });

  it('formats zero', () => {
    expect(formatPence(0)).toBe('£0');
  });

  it('formats a common price: 65000p = £650', () => {
    expect(formatPence(65000)).toBe('£650');
  });

  it('formats a large price: 5000000p = £50,000', () => {
    expect(formatPence(5000000)).toBe('£50,000');
  });

  it('formats minimum price: 25000p = £250', () => {
    expect(formatPence(25000)).toBe('£250');
  });
});

describe('formatPenceRange', () => {
  it('formats a range with em-dash separator', () => {
    const result = formatPenceRange(60775, 82225);
    expect(result).toBe('£608 – £822');
  });

  it('formats equal values', () => {
    const result = formatPenceRange(65000, 65000);
    expect(result).toBe('£650 – £650');
  });

  it('produces two formatted values separated by " – "', () => {
    const result = formatPenceRange(25000, 50000);
    expect(result).toContain(' – ');
    expect(result.startsWith('£')).toBe(true);
  });
});
