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

  // Sort (committed — drives the query)
  sort: 'valuation_desc',
  setSort: (sort) => set({ sort }),

  // Filters (committed — drives the query)
  filters: { ...DEFAULT_FILTERS },
  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),
  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  // ── Draft filters (mobile drawer only) ────────────────────────────────────
  // The drawer edits these; Apply Filters commits them to `filters`/`sort`.
  draftFilters: { ...DEFAULT_FILTERS },
  draftSort: 'valuation_desc',
  setDraftFilter: (key, value) =>
    set((state) => ({
      draftFilters: { ...state.draftFilters, [key]: value },
    })),
  setDraftSort: (sort) => set({ draftSort: sort }),
  resetDraftFilters: () =>
    set({
      draftFilters: { ...DEFAULT_FILTERS },
      draftSort: 'valuation_desc',
    }),

  /** Commit draft → live filters and close the drawer */
  applyDraftFilters: () => {
    const { draftFilters, draftSort } = get();
    set({
      filters: { ...draftFilters },
      sort: draftSort,
      isFilterDrawerOpen: false,
    });
  },

  // Filter drawer (mobile)
  isFilterDrawerOpen: false,
  openFilterDrawer: () => {
    // Sync draft from current committed state when opening
    const { filters, sort } = get();
    set({
      isFilterDrawerOpen: true,
      draftFilters: { ...filters },
      draftSort: sort,
    });
  },
  closeFilterDrawer: () => set({ isFilterDrawerOpen: false }),

  // Active filter count (computed from committed filters)
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
