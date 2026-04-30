import { create } from 'zustand';

const DEFAULT_FILTERS = {
  type: '',
  country: '',
  region: '',
  status: '',
  valuationMin: null,
  valuationMax: null,
  dateFrom: '',
  dateTo: '',
};

/**
 * Zustand store — UI state only.
 * TanStack Query handles all server/data state separately.
 */
export const useLedgerStore = create((set) => ({
  // Search input (raw — debounce happens in useAssets)
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Sort
  sort: 'valuation_desc',
  setSort: (sort) => set({ sort }),

  // Filters
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // Mobile filter drawer
  isFilterDrawerOpen: false,
  openFilterDrawer: () => set({ isFilterDrawerOpen: true }),
  closeFilterDrawer: () => set({ isFilterDrawerOpen: false }),
}));

/**
 * Returns the number of active (non-default) filters.
 * Extracted as a plain function so it's easy to test and understand.
 */
export function getActiveFilterCount(filters) {
  let count = 0;
  if (filters.type) count++;
  if (filters.country) count++;
  if (filters.region) count++;
  if (filters.status) count++;
  if (filters.valuationMin != null) count++;
  if (filters.valuationMax != null) count++;
  if (filters.dateFrom) count++;
  if (filters.dateTo) count++;
  return count;
}
