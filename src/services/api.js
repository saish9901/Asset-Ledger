import { getDataset } from './mockData.js';

// Simulated network latency: 300–700ms to mimic a real REST API
function delay() {
  const ms = Math.floor(Math.random() * 400) + 300;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ~3% random failure rate — demonstrates error handling + TanStack Query retries
function maybeThrowError() {
  if (Math.random() < 0.03) {
    throw new Error('Network error: Request failed. Please retry.');
  }
}

/**
 * Filter, search, sort, then paginate the in-memory dataset.
 * All data logic lives here — one place to reason about the data pipeline.
 *
 * Flow: search → filter → sort → cursor pagination
 */
function queryDataset(dataset, { search, filters, sort, cursor, limit }) {
  let results = dataset;

  // Search: match across id, name, owner, country, type
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (a) =>
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.owner.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }

  // Filters — each is optional and skipped when empty/null
  if (filters.type)    results = results.filter((a) => a.type === filters.type);
  if (filters.country) results = results.filter((a) => a.country === filters.country);
  if (filters.region)  results = results.filter((a) => a.region === filters.region);
  if (filters.status)  results = results.filter((a) => a.status === filters.status);
  if (filters.valuationMin != null) results = results.filter((a) => a.valuation >= filters.valuationMin);
  if (filters.valuationMax != null) results = results.filter((a) => a.valuation <= filters.valuationMax);
  if (filters.dateFrom) results = results.filter((a) => a.acquisitionDate >= filters.dateFrom);
  if (filters.dateTo)   results = results.filter((a) => a.acquisitionDate <= filters.dateTo);

  // Sort — spread to avoid mutating the original array
  if (sort) {
    results = [...results];
    switch (sort) {
      case 'valuation_desc': results.sort((a, b) => b.valuation - a.valuation); break;
      case 'valuation_asc':  results.sort((a, b) => a.valuation - b.valuation); break;
      case 'date_desc':      results.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate)); break;
      case 'date_asc':       results.sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate)); break;
      case 'name_asc':       results.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name_desc':      results.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
  }

  // Cursor-based pagination — returns a slice + the next cursor position
  const start = cursor;
  const end = Math.min(start + limit, results.length);
  const items = results.slice(start, end);
  const nextCursor = end < results.length ? end : null;

  return { items, nextCursor, total: results.length };
}

/**
 * fetchAssets — the single API function for the ledger.
 *
 * Simulates a paginated REST endpoint. Accepts cursor, limit, search,
 * filters, and sort. Returns items, nextCursor, and total match count.
 *
 * "We generate data locally with Faker and simulate real API behaviour
 *  (latency + errors) so the architecture is identical to a real backend."
 */
export async function fetchAssets({
  cursor = 0,
  limit = 50,
  search = '',
  filters = {},
  sort = '',
} = {}) {
  await delay();
  maybeThrowError();
  return queryDataset(getDataset(), { search, filters, sort, cursor, limit });
}
