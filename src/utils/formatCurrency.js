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

const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');

export function formatCurrency(value) {
  if (value == null || isNaN(value)) return '—';
  return USD_FORMATTER.format(value);
}

export function formatCurrencyCompact(value) {
  if (value == null || isNaN(value)) return '—';
  return USD_COMPACT_FORMATTER.format(value);
}

export function formatNumber(value) {
  if (value == null || isNaN(value)) return '—';
  return NUMBER_FORMATTER.format(value);
}

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
