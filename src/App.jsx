import React, { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import Navbar from './components/Navbar.jsx';
import SearchBar from './components/SearchBar.jsx';
import FilterDrawer, { FilterPanel } from './components/FilterPanel.jsx';
import LedgerView from './components/LedgerView.jsx';
import { useLedgerStore, getActiveFilterCount } from './store/useLedgerStore.js';
import { useAssets } from './hooks/useAssets.js';
import { workerManager } from './services/workerManager.js';

// ─── Worker init loading screen ───────────────────────────────────────────────
// Shown while the Web Worker is building the 1M-record dataset in the background.
// Disappears automatically once the worker sends INIT_COMPLETE.

function WorkerInitScreen() {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center gap-5 z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Logo mark */}
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="black" />
            <rect x="11" y="1" width="6" height="6" rx="1" fill="black" />
            <rect x="1" y="11" width="6" height="6" rx="1" fill="black" />
            <rect x="11" y="11" width="6" height="6" rx="1" fill="black" />
          </svg>
        </div>

        {/* Spinner */}
        <div
          className="w-7 h-7 rounded-full border-2 border-[#1f1f1f] border-t-white animate-spin"
          role="status"
          aria-label="Loading"
        />

        {/* Label */}
        <div className="text-center space-y-1.5">
          <p className="text-white text-sm font-semibold tracking-tight">
            Global Asset Ledger
          </p>
          <p className="text-[#555] mt-4 font-mono text-[10px] uppercase tracking-[0.18em]">
            Initialising · Building 1,000,000 records
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ledger UI ───────────────────────────────────────────────────────────
// Only rendered once the worker is ready. All hooks live here so they only
// run after the worker has data to respond to.

function LedgerContent() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const {
    allItems, total, isLoading, isFetching, isPlaceholderData,
    isFetchingNextPage, isError, hasNextPage, fetchNextPage, refetch, isSearching,
  } = useAssets({ enabled: true });

  // Show skeleton on first load AND when a filter/sort/search change is being processed.
  // isPlaceholderData is true when keepPreviousData is serving stale results while
  // the worker computes the new query — without this, the skeleton never shows on re-queries.
  const showSkeleton = isLoading || (isPlaceholderData && isFetching);

  const filters = useLedgerStore((s) => s.filters);
  const openFilterDrawer = useLedgerStore((s) => s.openFilterDrawer);
  const activeFilterCount = getActiveFilterCount(filters);

  return (
    <div className="h-dvh overflow-hidden bg-black text-white flex flex-col">
      <Navbar />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar */}
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
                Institutional-grade ledger tracking {(1000000).toLocaleString()}+ global assets in real time.
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-sm border-b border-[#111] px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
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

          {/* Ledger */}
          <div className="flex-1 overflow-hidden">
            <LedgerView
              items={allItems}
              total={total}
              isLoading={showSkeleton}
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

      {/* Mobile filter drawer */}
      <FilterDrawer />
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [workerReady, setWorkerReady] = useState(false);

  useEffect(() => {
    // Kick off worker initialization once on mount.
    // The worker generates 1M records in the background.
    // UI remains fully responsive during this time.
    workerManager.init(1_000_000).then(() => setWorkerReady(true));
  }, []);

  if (!workerReady) return <WorkerInitScreen />;

  return <LedgerContent />;
}
