/**
 * mockData.js — static lookup constants only.
 *
 * Dataset generation has moved to src/workers/ledgerWorker.js.
 * These constants are used by FilterPanel for dropdown options.
 * They are duplicated in the worker (which can't import from here)
 * but are small enough that duplication is fine.
 */

const REGIONS = {
  'North America': ['United States', 'Canada', 'Mexico'],
  'Europe': ['Germany', 'United Kingdom', 'France', 'Switzerland', 'Netherlands', 'Sweden', 'Norway'],
  'Asia Pacific': ['Japan', 'China', 'India', 'Singapore', 'Australia', 'South Korea', 'Hong Kong'],
  'Middle East': ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain'],
  'Latin America': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
  'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Egypt'],
};

export const ALL_COUNTRIES  = [...new Set(Object.values(REGIONS).flat())].sort();
export const ALL_ASSET_TYPES = [
  'Commodity', 'Corporate Bond', 'Cryptocurrency', 'Derivative', 'Equity',
  'Fixed Income', 'Hedge Fund', 'Infrastructure', 'Mutual Fund',
  'Private Equity', 'Real Estate', 'Treasury Bond',
];
export const ALL_STATUSES = ['Active', 'Inactive', 'Pending', 'Liquidated', 'Under Review'];
export const ALL_REGIONS  = Object.keys(REGIONS);
