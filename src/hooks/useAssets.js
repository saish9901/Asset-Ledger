import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { fetchAssets, fetchStats } from '../services/api.js';
import { useLedgerStore } from '../store/ledgerStore.js';
import { useDebounce } from './useDebounce.js';

const LIMIT = 50;

/**
 * Infinite query for the main ledger.
 * Debounces search automatically.
 */
export function useAssets() {
  const searchQuery = useLedgerStore((s) => s.searchQuery);
  const filters = useLedgerStore((s) => s.filters);
  const sort = useLedgerStore((s) => s.sort);

  const debouncedSearch = useDebounce(searchQuery, 350);

  const queryKey = ['assets', debouncedSearch, filters, sort];

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      fetchAssets({
        cursor: pageParam,
        limit: LIMIT,
        search: debouncedSearch,
        filters,
        sort,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 500,
  });

  // Flatten pages into a single items array
  const allItems = query.data?.pages.flatMap((p) => p.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;

  return {
    ...query,
    allItems,
    total,
    isSearching: searchQuery !== debouncedSearch,
  };
}

/**
 * Query for dashboard stats.
 */
export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}
