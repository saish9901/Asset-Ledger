import React, { memo, useCallback, useEffect, useState } from 'react';
import { SlidersHorizontal, Database, TrendingUp, Globe, Activity } from 'lucide-react';
import SearchBar from './components/search/SearchBar.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import FilterDrawer from './components/filters/FilterDrawer.jsx';
import VirtualizedList from './components/ledger/VirtualizedList.jsx';
import { StatCardSkeleton } from './components/ui/SkeletonLoader.jsx';
import { useLedgerStore } from './store/ledgerStore.js';
import { useAssets, useStats } from './hooks/useAssets.js';
import { formatCurrencyCompact, formatNumber } from './utils/formatCurrency.js';
import { generateDataset } from './services/mockData.js';

// Preload dataset on module init (background worker would be ideal; this is a heavy sync op)
// We do this outside render to avoid blocking.
let datasetReady = false;
setTimeout(() => {
  generateDataset(100000);
  datasetReady = true;
}, 0);

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = memo(function StatCard({ icon: Icon, label, value, sub, loading }) {
  if (loading) return <StatCardSkeleton />;
  return (
    <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-xl p-4 space-y-1 hover:border-[#2a2a2a] transition-colors">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} className="text-[#777]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#777]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white tracking-tight leading-none">{value}</p>
      {sub && <p className="text-[11px] text-[#bbb] font-mono">{sub}</p>}
    </div>
  );
});

// ── Hero Banner ──────────────────────────────────────────────────────────────
const HeroBanner = memo(function HeroBanner({ stats, statsLoading, total, items }) {
  return (
    <div className="px-4 sm:px-6 pt-6 pb-4 border-b border-[#111] space-y-5">
      {/* Title block */}
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
          Institutional-grade ledger tracking {(100000).toLocaleString()}+ global assets in real time.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Database}
          label="Total Assets"
          value={statsLoading ? '—' : formatNumber(stats?.totalAssets)}
          sub="across all classes"
          loading={statsLoading}
        />
        <StatCard
          icon={Activity}
          label="Active Assets"
          value={statsLoading ? '—' : formatNumber(stats?.activeAssets)}
          sub="live positions"
          loading={statsLoading}
        />
        <StatCard
          icon={Globe}
          label="Countries"
          value={statsLoading ? '—' : stats?.countriesCovered}
          sub="global coverage"
          loading={statsLoading}
        />
        <StatCard
          icon={TrendingUp}
          label="Portfolio Value"
          value={statsLoading ? '—' : formatCurrencyCompact(stats?.portfolioValue)}
          sub="total valuation"
          loading={statsLoading}
        />
      </div>
    </div>
  );
});

// ── Ledger toolbar ───────────────────────────────────────────────────────────
const LedgerToolbar = memo(function LedgerToolbar({ total, items, activeFilterCount }) {
  const openFilterDrawer = useLedgerStore((s) => s.openFilterDrawer);

  return (
    <div className="sticky top-14 z-30 bg-black/95 backdrop-blur-sm border-b border-[#111] px-4 sm:px-6 py-3 flex items-center gap-3">
      {/* Search */}
      <div className="flex-1 min-w-0">
        <SearchBar />
      </div>

      {/* Mobile filter button */}
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
        <span>{items.toLocaleString()}</span>
        <span>/</span>
        <span>{total.toLocaleString()}</span>
      </div>
    </div>
  );
});

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const {
    allItems,
    total,
    isLoading,
    isFetchingNextPage,
    isError,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useAssets();

  const { data: stats, isLoading: statsLoading } = useStats();
  const activeFilterCount = useLedgerStore((s) => s.activeFilterCount);

  return (
    <div className="h-dvh overflow-hidden bg-black text-white flex flex-col">
      <Navbar />

      {/* Page body — fills exactly the remaining viewport below the navbar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Desktop sidebar — naturally pinned inside the fixed-height flex container */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Hero */}
          <HeroBanner
            stats={stats}
            statsLoading={statsLoading}
            total={total}
            items={allItems.length}
          />

          {/* Toolbar */}
          <LedgerToolbar
            total={total}
            items={allItems.length}
            activeFilterCount={activeFilterCount}
          />

          {/* Ledger */}
          <div className="flex-1 overflow-hidden">
            <VirtualizedList
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

      {/* Mobile filter drawer */}
      <FilterDrawer />
    </div>
  );
}

