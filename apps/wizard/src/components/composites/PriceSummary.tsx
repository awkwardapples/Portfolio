import { formatPence, formatPenceRange } from '@/utils/format-currency';

interface PriceSummaryProps {
  totalPence: number;
  rangeMinPence: number;
  rangeMaxPence: number;
}

/**
 * Displays the current price estimate and its uncertainty range.
 * Rendered only when the pricing engine returns valid: true.
 */
export function PriceSummary({
  totalPence,
  rangeMinPence,
  rangeMaxPence,
}: PriceSummaryProps): JSX.Element {
  const showRange = rangeMinPence !== rangeMaxPence;

  return (
    <div
      className="rounded border border-border bg-surface-sunken p-4"
      aria-label="Estimated price"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-text-muted">Estimated price</p>
      <p className="mt-1 text-xl font-semibold text-text">{formatPence(totalPence)}</p>
      {showRange && (
        <p className="mt-1 text-sm text-text-muted">
          Range: {formatPenceRange(rangeMinPence, rangeMaxPence)}
        </p>
      )}
    </div>
  );
}
