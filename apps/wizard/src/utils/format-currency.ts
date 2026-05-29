const GBP_FORMATTER = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Formats an integer pence value as a GBP string, e.g. 32500 → "£325". */
export function formatPence(pence: number): string {
  return GBP_FORMATTER.format(pence / 100);
}

/** Formats two integer pence values as a range string, e.g. "£275 – £375". */
export function formatPenceRange(minPence: number, maxPence: number): string {
  return `${formatPence(minPence)} – ${formatPence(maxPence)}`;
}
