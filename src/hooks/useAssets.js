import { useEffect, useState } from 'react';
import { useInfiniteQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAssets } from '../services/api.js';
import { useLedgerStore } from '../store/useLedgerStore.js';

const PAGE_SIZE = 50;

// Inlined debounce — only used here, not worth a separate file.
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * useAssets — single data hook for the ledger.
 *
 * @param {boolean} enabled — pass false while the worker is not yet ready
 *                            so TanStack Query doesn't fire before the worker exists.
 *
 * Data flow:
 *   User types → Zustand searchQuery → debounced 350ms → queryKey changes
 *   → fetchAssets() → workerManager.query() → worker processes → 50-record slice returned
 *   → TanStack Query caches it → allItems flattened → react-window renders visible rows
 */
export function useAssets({ enabled = true } = {}) {
  const searchQuery = useLedgerStore((s) => s.searchQuery);
  const filters     = useLedgerStore((s) => s.filters);
  const sort        = useLedgerStore((s) => s.sort);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const query = useInfiniteQuery({
    queryKey:  ['assets', debouncedSearch, filters, sort],
    queryFn:   ({ pageParam = 0 }) =>
      fetchAssets({
        cursor: pageParam,
        limit:  PAGE_SIZE,
        search: debouncedSearch,
        filters,
        sort,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 1000 * 30,   // 30s — cached pages stay fresh
    gcTime:    1000 * 60 * 5, // 5m — pages kept in memory across filter changes
    // Keep previous results visible while the worker processes the new query.
    // Without this, the list flashes empty on every search/filter/sort change.
    placeholderData: keepPreviousData,
  });

  const allItems = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total    = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    allItems,
    total,
    // True while the user is still typing (debounce pending)
    isSearching: searchQuery !== debouncedSearch,
  };
}
