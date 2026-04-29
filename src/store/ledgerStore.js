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

export const useLedgerStore = create((set, get) => ({
  // Search
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Sort
  sort: 'valuation_desc',
  setSort: (sort) => set({ sort }),

  // Filters
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // Filter drawer (mobile)
  isFilterDrawerOpen: false,
  openFilterDrawer: () => set({ isFilterDrawerOpen: true }),
  closeFilterDrawer: () => set({ isFilterDrawerOpen: false }),

  // Active filter count (computed)
  get activeFilterCount() {
    const f = get().filters;
    let count = 0;
    if (f.type) count++;
    if (f.country) count++;
    if (f.region) count++;
    if (f.status) count++;
    if (f.valuationMin != null) count++;
    if (f.valuationMax != null) count++;
    if (f.dateFrom) count++;
    if (f.dateTo) count++;
    return count;
  },

  // View mode
  viewMode: 'auto', // 'auto' | 'table' | 'cards'
  setViewMode: (mode) => set({ viewMode: mode }),
}));
