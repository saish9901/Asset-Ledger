import { faker } from '@faker-js/faker';

// ─── Static lookup tables ────────────────────────────────────────────────────

const ASSET_TYPES = [
  'Equity', 'Fixed Income', 'Real Estate', 'Commodity',
  'Private Equity', 'Hedge Fund', 'Infrastructure', 'Cryptocurrency',
  'Treasury Bond', 'Corporate Bond', 'Derivative', 'Mutual Fund',
];

const STATUSES = ['Active', 'Inactive', 'Pending', 'Liquidated', 'Under Review'];
const STATUS_WEIGHTS = [55, 15, 15, 10, 5];

const REGIONS = {
  'North America': ['United States', 'Canada', 'Mexico'],
  'Europe': ['Germany', 'United Kingdom', 'France', 'Switzerland', 'Netherlands', 'Sweden', 'Norway'],
  'Asia Pacific': ['Japan', 'China', 'India', 'Singapore', 'Australia', 'South Korea', 'Hong Kong'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain'],
  'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
  'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt'],
};

// Flat array of {region, country} pairs for O(1) random pick
const REGION_COUNTRY_PAIRS = [];
for (const [region, countries] of Object.entries(REGIONS)) {
  for (const country of countries) {
    REGION_COUNTRY_PAIRS.push({ region, country });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Faster than faker.date.between — no locale overhead
const DATE_START_MS = new Date('2005-01-01').getTime();
const DATE_RANGE_MS = new Date('2025-12-31').getTime() - DATE_START_MS;
function randomDate() {
  return new Date(DATE_START_MS + Math.random() * DATE_RANGE_MS)
    .toISOString()
    .split('T')[0];
}

// ─── Dataset (lives entirely in worker memory) ───────────────────────────────

let _dataset = null;

function buildDataset(count) {
  const POOL_SIZE = 10_000;

  // Step 1: Faker called only 20k times total (not 3M)
  console.time('[worker] Pool build');
  const companies = Array.from({ length: POOL_SIZE }, () => faker.company.name());
  const people    = Array.from({ length: POOL_SIZE }, () => faker.person.fullName());
  console.timeEnd('[worker] Pool build');

  // Step 2: 1M loop — no Faker inside, just array lookups + Math.random()
  console.time('[worker] Dataset generation');
  const assets = new Array(count);
  for (let i = 0; i < count; i++) {
    const { region, country } = pick(REGION_COUNTRY_PAIRS);
    const assetType = pick(ASSET_TYPES);
    assets[i] = {
      id:              `GAL-${String(i + 1).padStart(7, '0')}`,
      name:            pick(companies) + ' ' + assetType,
      type:            assetType,
      owner:           pick(people),
      country,
      region,
      valuation:       Math.floor(Math.random() * 999_000_000 + 100_000),
      acquisitionDate: randomDate(),
      status:          weightedRandom(STATUSES, STATUS_WEIGHTS),
    };
  }
  console.timeEnd('[worker] Dataset generation');

  return assets;
}

// ─── Query pipeline (search → filter → sort → paginate) ─────────────────────

function queryDataset(params) {
  const { search, filters = {}, sort, cursor = 0, limit = 50 } = params;
  let results = _dataset;

  // Search: scan across id, name, owner, country, type
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    results = results.filter(
      (a) =>
        a.id.toLowerCase().includes(q)      ||
        a.name.toLowerCase().includes(q)    ||
        a.owner.toLowerCase().includes(q)   ||
        a.country.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
    );
  }

  // Filters — each optional, skipped when empty/null
  if (filters.type)             results = results.filter((a) => a.type === filters.type);
  if (filters.country)          results = results.filter((a) => a.country === filters.country);
  if (filters.region)           results = results.filter((a) => a.region === filters.region);
  if (filters.status)           results = results.filter((a) => a.status === filters.status);
  if (filters.valuationMin != null) results = results.filter((a) => a.valuation >= filters.valuationMin);
  if (filters.valuationMax != null) results = results.filter((a) => a.valuation <= filters.valuationMax);
  if (filters.dateFrom)         results = results.filter((a) => a.acquisitionDate >= filters.dateFrom);
  if (filters.dateTo)           results = results.filter((a) => a.acquisitionDate <= filters.dateTo);

  // Sort — spread to avoid mutating dataset reference
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

  // Cursor pagination — only the requested slice crosses the thread boundary
  const start = cursor;
  const end   = Math.min(start + limit, results.length);
  const items = results.slice(start, end);
  const nextCursor = end < results.length ? end : null;

  return { items, nextCursor, total: results.length };
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.onmessage = function ({ data }) {
  const { type, payload, id } = data;

  if (type === 'INIT') {
    _dataset = buildDataset(payload.count || 1_000_000);
    self.postMessage({ type: 'INIT_COMPLETE', payload: { total: _dataset.length } });
    return;
  }

  if (type === 'QUERY') {
    try {
      const result = queryDataset(payload);
      self.postMessage({ type: 'QUERY_RESULT', payload: result, id });
    } catch (err) {
      self.postMessage({ type: 'QUERY_ERROR', payload: { error: err.message }, id });
    }
    return;
  }
};
