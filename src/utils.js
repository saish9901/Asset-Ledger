// Singleton Intl formatters — created once, reused on every render for performance

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const USD_COMPACT_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  compactDisplay: 'short',
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
});

/** Format a number as full USD, e.g. $1,234,567 */
export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  return USD_FORMATTER.format(value);
}

/** Format a number as compact USD, e.g. $1.2M */
export function formatCurrencyCompact(value) {
  if (value == null || isNaN(value)) return '—';
  return USD_COMPACT_FORMATTER.format(value);
}

/** Format an ISO date string as "Jan 1, 2024" */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
