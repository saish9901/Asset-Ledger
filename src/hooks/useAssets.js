import { useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchAssets } from '../services/api.js';
import { useLedgerStore } from '../store/useLedgerStore.js';

const PAGE_SIZE = 50;

// Debounce: waits until the user stops typing for `delay`ms before updating.
// Inlined here because it's only needed by this hook.
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * useAssets — the single data hook for the ledger.
 *
 * Reads UI state (search, filters, sort) from Zustand.
 * Manages server state (pages, caching, loading) via TanStack Query.
 * Debounces the search query to reduce unnecessary fetches.
 *
 * Data flow:
 *   User types → Zustand searchQuery → debounced → TanStack queryKey changes
 *   → fetchAssets() called → api.js: search/filter/sort/paginate → cached result
 */
export function useAssets() {
  const searchQuery = useLedgerStore((s) => s.searchQuery);
  const filters     = useLedgerStore((s) => s.filters);
  const sort        = useLedgerStore((s) => s.sort);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const query = useInfiniteQuery({
    queryKey: ['assets', debouncedSearch, filters, sort],
    queryFn: ({ pageParam = 0 }) =>
      fetchAssets({
        cursor: pageParam,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        filters,
        sort,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    staleTime: 1000 * 30,   // 30s — data stays fresh without refetch
    gcTime: 1000 * 60 * 5,  // 5m  — cached pages are kept in memory
  });

  // Flatten all loaded pages into one list for the virtualized renderer
  const allItems = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total    = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    allItems,
    total,
    // True while the user is still typing (debounce hasn't settled yet)
    isSearching: searchQuery !== debouncedSearch,
  };
}
