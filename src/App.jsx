import React, { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import SearchBar from './components/SearchBar.jsx';
import FilterDrawer, { FilterPanel } from './components/FilterPanel.jsx';
import LedgerView from './components/LedgerView.jsx';
import { useLedgerStore, getActiveFilterCount } from './store/useLedgerStore.js';
import { useAssets } from './hooks/useAssets.js';
import { generateDataset } from './services/mockData.js';

// Generate the full dataset once at startup, outside React's render cycle.
// This is synchronous but runs before any component mounts — acceptable for a demo.
generateDataset(200000);

export default function App() {
  // Track viewport width to switch between mobile cards and desktop table
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // All server state: data, loading, pagination, errors
  const {
    allItems, total, isLoading, isFetchingNextPage,
    isError, hasNextPage, fetchNextPage, refetch, isSearching,
  } = useAssets();

  // UI state: filters (for badge count), drawer toggle
  const filters = useLedgerStore((s) => s.filters);
  const openFilterDrawer = useLedgerStore((s) => s.openFilterDrawer);
  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className="h-dvh overflow-hidden bg-black text-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar — hidden on mobile, visible lg+ */}
        <aside
          className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 bg-[#080808] border-r border-[#141414] h-full overflow-hidden"
          aria-label="Filter panel"
        >
          <FilterPanel />
        </aside>

        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Hero banner */}
          <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-[#111]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#777]">
                  Global Asset Ledger
                </span>
                <span className="h-px flex-1 bg-[#1a1a1a]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
                Enterprise Asset Portfolio
              </h1>
              <p className="text-sm text-[#bbb]">
                Institutional-grade ledger tracking {(200000).toLocaleString()}+ global assets in real time.
              </p>
            </div>
          </div>

          {/* Toolbar: search input + mobile filter button + result count */}
          <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-sm border-b border-[#111] px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {/* isSearching drives the spinner inside SearchBar */}
              <SearchBar isSearching={isSearching} />
            </div>

            {/* Filter button — mobile only */}
            <button
              id="open-filters-btn"
              onClick={openFilterDrawer}
              aria-label="Open filters"
              className="lg:hidden flex-shrink-0 flex items-center gap-2 bg-[#111] border border-[#1f1f1f]
                rounded-lg px-3 py-2.5 text-sm text-white hover:border-[#2a2a2a] transition-colors relative"
            >
              <SlidersHorizontal size={14} className="text-[#bbb]" />
              <span className="text-xs hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Result count */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#777] font-mono flex-shrink-0">
              <span>{allItems.length.toLocaleString()}</span>
              <span>/</span>
              <span>{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Ledger — fills all remaining space */}
          <div className="flex-1 overflow-hidden">
            <LedgerView
              items={allItems}
              total={total}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              isError={isError}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              refetch={refetch}
              isMobile={isMobile}
            />
          </div>
        </main>
      </div>

      {/* Mobile filter drawer — slides up from the bottom on small screens */}
      <FilterDrawer />
    </div>
  );
}
