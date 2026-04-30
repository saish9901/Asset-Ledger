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

let _dataset = null;

export function generateDataset(count = 1000000) {
  if (_dataset) return _dataset;

  console.time('[mockData] Dataset generation');
  const assets = new Array(count);

  for (let i = 0; i < count; i++) {
    const { region, country } = getRandomRegionCountry();
    const assetType = ASSET_TYPES[Math.floor(Math.random() * ASSET_TYPES.length)];
    const status = weightedRandom(STATUSES, STATUS_WEIGHTS);
    const valuation = parseFloat((Math.random() * 999_000_000 + 100_000).toFixed(2));
    const acquisitionDate = faker.date.between({
      from: new Date('2005-01-01'),
      to: new Date('2025-12-31'),
    });

    assets[i] = {
      id: `GAL-${String(i + 1).padStart(7, '0')}`,
      name: faker.company.name() + ' ' + assetType,
      type: assetType,
      owner: faker.person.fullName(),
      country,
      region,
      valuation,
      acquisitionDate: acquisitionDate.toISOString().split('T')[0],
      status,
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
