import { describe, expect, it } from 'vitest';

import {
  metersToFeet,
  squareMetersToSquareFeet,
  formatMeasurementWithFeet,
  formatMeasurementRangeWithFeet,
} from '../units';

describe('metersToFeet', () => {
  it('converts a whole number of metres', () => {
    expect(metersToFeet(10)).toBe(33);
  });

  it('converts zero', () => {
    expect(metersToFeet(0)).toBe(0);
  });

  it('converts a fractional fence-height value', () => {
    expect(metersToFeet(1.8)).toBe(6);
  });

  it('converts a large value', () => {
    expect(metersToFeet(60)).toBe(197);
  });
});

describe('squareMetersToSquareFeet', () => {
  it('converts a whole number of square metres (not the linear factor)', () => {
    expect(squareMetersToSquareFeet(20)).toBe(215);
  });

  it('converts zero', () => {
    expect(squareMetersToSquareFeet(0)).toBe(0);
  });

  it('converts a large area', () => {
    expect(squareMetersToSquareFeet(150)).toBe(1615);
  });
});

describe('formatMeasurementWithFeet', () => {
  it('formats a linear metre value', () => {
    expect(formatMeasurementWithFeet(20, 'm')).toBe('20m (66 ft)');
  });

  it('formats a square metre value using the area conversion, not the linear one', () => {
    expect(formatMeasurementWithFeet(20, 'm²')).toBe('20m² (215 ft²)');
  });

  it('falls back to an unconverted string for an unrecognized unit', () => {
    expect(formatMeasurementWithFeet(5, 'item')).toBe('5item');
  });
});

describe('formatMeasurementRangeWithFeet', () => {
  it('formats a linear metre range', () => {
    expect(formatMeasurementRangeWithFeet(0, 10, 'm')).toBe('0–10 m (0–33 ft)');
  });

  it('formats a square metre range using the area conversion', () => {
    expect(formatMeasurementRangeWithFeet(30, 60, 'm²')).toBe('30–60 m² (323–646 ft²)');
  });

  it('falls back to an unconverted range for an unrecognized unit', () => {
    expect(formatMeasurementRangeWithFeet(1, 5, 'item')).toBe('1–5 item');
  });
});
