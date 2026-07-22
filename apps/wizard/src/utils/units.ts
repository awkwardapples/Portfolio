const METRES_PER_FOOT = 3.28084;

/** Converts linear metres to feet, rounded to the nearest whole foot. */
export function metersToFeet(meters: number): number {
  return Math.round(meters * METRES_PER_FOOT);
}

/** Converts square metres to square feet, rounded to the nearest whole square foot. */
export function squareMetersToSquareFeet(squareMeters: number): number {
  return Math.round(squareMeters * METRES_PER_FOOT * METRES_PER_FOOT);
}

/**
 * Formats a single measurement with its feet/square-feet equivalent in
 * brackets, e.g. `formatMeasurementWithFeet(20, 'm')` => "20m (66 ft)".
 *
 * `unit` must be `'m'` or `'m²'` to get a conversion; any other unit is
 * returned as `${value}${unit}` unchanged, since a feet equivalent isn't
 * meaningful for non-length/area units (e.g. a step count).
 */
export function formatMeasurementWithFeet(value: number, unit: string): string {
  if (unit === 'm²') {
    return `${value}m² (${squareMetersToSquareFeet(value)} ft²)`;
  }
  if (unit === 'm') {
    return `${value}m (${metersToFeet(value)} ft)`;
  }
  return `${value}${unit}`;
}

/**
 * Formats a min–max measurement range with its feet/square-feet equivalent
 * in brackets, e.g. `formatMeasurementRangeWithFeet(0, 10, 'm')` =>
 * "0–10 m (0–33 ft)". Falls back to the plain range for unrecognized units.
 */
export function formatMeasurementRangeWithFeet(
  minValue: number,
  maxValue: number,
  unit: string,
): string {
  if (unit === 'm²') {
    return `${minValue}–${maxValue} m² (${squareMetersToSquareFeet(minValue)}–${squareMetersToSquareFeet(maxValue)} ft²)`;
  }
  if (unit === 'm') {
    return `${minValue}–${maxValue} m (${metersToFeet(minValue)}–${metersToFeet(maxValue)} ft)`;
  }
  return `${minValue}–${maxValue} ${unit}`;
}
