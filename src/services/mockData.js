import { faker } from '@faker-js/faker';

const ASSET_TYPES = [
  'Equity', 'Fixed Income', 'Real Estate', 'Commodity',
  'Private Equity', 'Hedge Fund', 'Infrastructure', 'Cryptocurrency',
  'Treasury Bond', 'Corporate Bond', 'Derivative', 'Mutual Fund',
];

const STATUSES = ['Active', 'Inactive', 'Pending', 'Liquidated', 'Under Review'];
const STATUS_WEIGHTS = [55, 15, 15, 10, 5]; // probability weights

const REGIONS = {
  'North America': ['United States', 'Canada', 'Mexico'],
  'Europe': ['Germany', 'United Kingdom', 'France', 'Switzerland', 'Netherlands', 'Sweden', 'Norway'],
  'Asia Pacific': ['Japan', 'China', 'India', 'Singapore', 'Australia', 'South Korea', 'Hong Kong'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain'],
  'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
  'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt'],
};

const REGION_ENTRIES = Object.entries(REGIONS);

function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function getRandomRegionCountry() {
  const [region, countries] = REGION_ENTRIES[Math.floor(Math.random() * REGION_ENTRIES.length)];
  const country = countries[Math.floor(Math.random() * countries.length)];
  return { region, country };
}

// Pre-built pools for expensive Faker calls.
// Instead of calling Faker 3M times (once per record × 1M records),
// we call it 20,000 times upfront and randomly sample from the pool.
// This is the key optimisation — reduces Faker calls by ~99%.
const POOL_SIZE = 10_000;

function buildPools() {
  console.time('[mockData] Pool build');
  const companies = Array.from({ length: POOL_SIZE }, () => faker.company.name());
  const people    = Array.from({ length: POOL_SIZE }, () => faker.person.fullName());
  console.timeEnd('[mockData] Pool build');
  return { companies, people };
}

// Date generation — no Faker needed, plain Math.random() is 10x faster
const DATE_START_MS = new Date('2005-01-01').getTime();
const DATE_RANGE_MS = new Date('2025-12-31').getTime() - DATE_START_MS;

function randomDate() {
  const ms = DATE_START_MS + Math.random() * DATE_RANGE_MS;
  return new Date(ms).toISOString().split('T')[0]; // "YYYY-MM-DD"
}

function pick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}

let _dataset = null;

export function generateDataset(count = 1000000) {
  if (_dataset) return _dataset;

  // Step 1: Build name pools — 20k Faker calls total (fast)
  const { companies, people } = buildPools();

  // Step 2: Generate 1M records using pool lookups (no Faker in loop)
  console.time('[mockData] Dataset generation');
  const assets = new Array(count);

  for (let i = 0; i < count; i++) {
    const { region, country } = getRandomRegionCountry();
    const assetType = pick(ASSET_TYPES);
    assets[i] = {
      id: `GAL-${String(i + 1).padStart(7, '0')}`,
      name: pick(companies) + ' ' + assetType,
      type: assetType,
      owner: pick(people),
      country,
      region,
      valuation: Math.floor(Math.random() * 999_000_000 + 100_000),
      acquisitionDate: randomDate(),
      status: weightedRandom(STATUSES, STATUS_WEIGHTS),
    };
  }

  console.timeEnd('[mockData] Dataset generation');
  _dataset = assets;
  return _dataset;
}

export function getDataset() {
  return _dataset || generateDataset();
}

export const ALL_COUNTRIES = [...new Set(Object.values(REGIONS).flat())].sort();
export const ALL_ASSET_TYPES = [...ASSET_TYPES].sort();
export const ALL_STATUSES = [...STATUSES];
export const ALL_REGIONS = Object.keys(REGIONS);
