import { getDataset } from './mockData.js';
import { applyFiltersAndSearch, paginateResults } from '../utils/filterHelpers.js';

const DEFAULT_DELAY_MIN = 300;
const DEFAULT_DELAY_MAX = 700;

function delay(min = DEFAULT_DELAY_MIN, max = DEFAULT_DELAY_MAX) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simulate random network errors ~3% of the time
function maybeThrowError() {
  if (Math.random() < 0.03) {
    throw new Error('Network error: Request failed. Please retry.');
  }
}

/**
 * GET /api/assets
 * Supports: cursor, limit, search, type, country, region, status, sort,
 *           valuationMin, valuationMax, dateFrom, dateTo
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

  const dataset = getDataset();

  const filtered = applyFiltersAndSearch(dataset, { search, filters, sort });
  const paginated = paginateResults(filtered, cursor, limit);

  return {
    items: paginated.items,
    nextCursor: paginated.nextCursor,
    total: paginated.total,
    cursor,
    limit,
  };
}

/**
 * GET /api/assets/stats
 * Returns aggregate statistics about the whole dataset.
 */
export async function fetchStats() {
  await delay(200, 400);

  const dataset = getDataset();

  let totalValuation = 0;
  const activeSet = new Set();
  const countrySet = new Set();

  for (const asset of dataset) {
    totalValuation += asset.valuation;
    if (asset.status === 'Active') activeSet.add(asset.id);
    countrySet.add(asset.country);
  }

  return {
    totalAssets: dataset.length,
    activeAssets: activeSet.size,
    countriesCovered: countrySet.size,
    portfolioValue: totalValuation,
  };
}

/**
 * GET /api/assets/:id
 */
export async function fetchAssetById(id) {
  await delay(100, 300);

  const dataset = getDataset();
  const asset = dataset.find((a) => a.id === id);
  if (!asset) throw new Error(`Asset ${id} not found`);
  return asset;
}
