/**
 * Applies all active filters + search to a dataset slice.
 * Returns { results, total } for pagination.
 */
export function applyFiltersAndSearch(dataset, { search, filters, sort }) {
  let results = dataset;

  // --- Search ---
  if (search && search.trim().length > 0) {
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

  // --- Filters ---
  if (filters.type) {
    results = results.filter((a) => a.type === filters.type);
  }
  if (filters.country) {
    results = results.filter((a) => a.country === filters.country);
  }
  if (filters.region) {
    results = results.filter((a) => a.region === filters.region);
  }
  if (filters.status) {
    results = results.filter((a) => a.status === filters.status);
  }
  if (filters.valuationMin != null) {
    results = results.filter((a) => a.valuation >= filters.valuationMin);
  }
  if (filters.valuationMax != null) {
    results = results.filter((a) => a.valuation <= filters.valuationMax);
  }
  if (filters.dateFrom) {
    results = results.filter((a) => a.acquisitionDate >= filters.dateFrom);
  }
  if (filters.dateTo) {
    results = results.filter((a) => a.acquisitionDate <= filters.dateTo);
  }

  // --- Sort ---
  if (sort) {
    results = [...results]; // avoid mutating
    switch (sort) {
      case 'valuation_desc':
        results.sort((a, b) => b.valuation - a.valuation);
        break;
      case 'valuation_asc':
        results.sort((a, b) => a.valuation - b.valuation);
        break;
      case 'date_desc':
        results.sort((a, b) => b.acquisitionDate.localeCompare(a.acquisitionDate));
        break;
      case 'date_asc':
        results.sort((a, b) => a.acquisitionDate.localeCompare(b.acquisitionDate));
        break;
      case 'name_asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        results.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
  }

  return results;
}

export function paginateResults(results, cursor, limit) {
  const start = cursor;
  const end = Math.min(start + limit, results.length);
  const items = results.slice(start, end);
  const nextCursor = end < results.length ? end : null;
  return { items, nextCursor, total: results.length };
}
