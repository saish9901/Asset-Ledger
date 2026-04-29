import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { Loader2, RefreshCw } from 'lucide-react';
import AssetCard from './AssetCard.jsx';
import LedgerTable from './LedgerTable.jsx';
import { CardSkeletonList, TableSkeletonList } from '../ui/SkeletonLoader.jsx';

// ── Lightweight virtual list (no react-window dependency) ────────────────────
// Uses position:absolute + translateY so only visible rows mount.
const CARD_HEIGHT = 196; // px per card including 12px gap
const OVERSCAN = 4;

function useVirtualCards(items, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIdx = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / CARD_HEIGHT) + OVERSCAN * 2;
  const endIdx = Math.min(items.length - 1, startIdx + visibleCount);

  const totalHeight = items.length * CARD_HEIGHT;

  return { startIdx, endIdx, totalHeight, setScrollTop };
}

// ── Sentinel for infinite scroll ─────────────────────────────────────────────
const LoadMoreSentinel = memo(function LoadMoreSentinel({ onVisible }) {
  const { ref } = useInView({
    threshold: 0.1,
    onChange: (inView) => { if (inView) onVisible(); },
  });
  return <div ref={ref} style={{ height: 1 }} aria-hidden="true" />;
});

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#0d0d0d] border border-[#1a1a1a] flex items-center justify-center mb-5">
        <span className="text-[#2a2a2a] text-3xl font-bold">◻</span>
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">No matching assets found</h3>
      <p className="text-sm text-[#bbb] max-w-xs leading-relaxed">
        Adjust your search query or remove active filters to see results.
      </p>
    </div>
  );
});

// ── Error state ───────────────────────────────────────────────────────────────
const ErrorState = memo(function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center fade-in">
      <div className="w-14 h-14 rounded-2xl bg-[#140808] border border-[#2a1010] flex items-center justify-center mb-5">
        <span className="text-[#c0392b] text-2xl font-bold">!</span>
      </div>
      <h3 className="text-base font-semibold text-white mb-1.5">Request failed</h3>
      <p className="text-sm text-[#bbb] mb-5 max-w-xs leading-relaxed">
        A network error occurred while loading assets. Please try again.
      </p>
      <button
        onClick={onRetry}
        id="retry-btn"
        className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-5 py-2.5 rounded-lg
          hover:bg-[#e8e8e8] active:scale-95 transition-all duration-150"
      >
        <RefreshCw size={13} />
        Retry
      </button>
    </div>
  );
});

// ── Mobile virtualized card list ──────────────────────────────────────────────
const VirtualCardList = memo(function VirtualCardList({
  items, hasNextPage, isFetchingNextPage, fetchNextPage,
}) {
  const containerRef = useRef(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const { startIdx, endIdx, totalHeight, setScrollTop } = useVirtualCards(items, containerHeight);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const visibleItems = [];
  for (let i = startIdx; i <= endIdx; i++) {
    if (items[i]) visibleItems.push({ item: items[i], idx: i });
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto h-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Virtual container */}
      <div style={{ height: totalHeight + 80, position: 'relative' }}>
        {visibleItems.map(({ item, idx }) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: idx * CARD_HEIGHT + 16,
              left: 16,
              right: 16,
              height: CARD_HEIGHT - 12,
            }}
          >
            <AssetCard asset={item} />
          </div>
        ))}

        {/* Sentinel + loading indicator at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isFetchingNextPage && (
            <Loader2 size={18} className="text-[#777] animate-spin" />
          )}
          {hasNextPage && <LoadMoreSentinel onVisible={handleLoadMore} />}
        </div>
      </div>
    </div>
  );
});

// ── Main VirtualizedList ──────────────────────────────────────────────────────
const VirtualizedList = memo(function VirtualizedList({
  items,
  total,
  isLoading,
  isFetchingNextPage,
  isError,
  hasNextPage,
  fetchNextPage,
  refetch,
  isMobile,
}) {
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return isMobile ? <CardSkeletonList count={6} /> : <TableSkeletonList count={18} />;
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return <ErrorState onRetry={refetch} />;
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return <EmptyState />;
  }

  // ── Mobile: custom virtual card list ──────────────────────────────────────
  if (isMobile) {
    return (
      <VirtualCardList
        items={items}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    );
  }

  // ── Desktop: table with native scroll + sentinel ───────────────────────────
  return (
    <div className="overflow-x-auto overflow-y-auto h-full">
      <LedgerTable items={items} />

      {/* Footer row: count + load indicator */}
      <div className="px-4 py-3.5 border-t border-[#0f0f0f] flex items-center justify-between bg-[#060606]">
        <span className="text-xs text-[#999] font-mono">
          Showing {items.length.toLocaleString()} of {total.toLocaleString()} assets
        </span>
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-xs text-[#777] font-mono">
            <Loader2 size={11} className="animate-spin" />
            Loading more…
          </div>
        )}
        {!isFetchingNextPage && hasNextPage && (
          <span className="text-xs text-[#999] font-mono">Scroll to load more</span>
        )}
      </div>
      {hasNextPage && <LoadMoreSentinel onVisible={handleLoadMore} />}
    </div>
  );
});

export default VirtualizedList;

