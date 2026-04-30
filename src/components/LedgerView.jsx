import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { List } from 'react-window';
import { useInView } from 'react-intersection-observer';
import { Loader2, RefreshCw } from 'lucide-react';
import AssetCard from './AssetCard.jsx';
import LedgerTable from './LedgerTable.jsx';
import { CardSkeletonList, TableSkeletonList } from './SkeletonLoader.jsx';

// ── Mobile: react-window List ─────────────────────────────────────────────────
// Each card row is a fixed height — only visible rows are rendered in the DOM.
const CARD_HEIGHT = 200; // px — card ~184px + 16px gap

/**
 * Row renderer for react-window v2.
 * Receives `index` + `style` from the List, plus anything in `rowProps` spread directly.
 */
const Row = memo(function Row({ index, style, items, isFetchingNextPage }) {
  // Last slot shows a spinner while the next page is loading
  if (index === items.length) {
    return (
      <div style={style} className="flex items-center justify-center">
        {isFetchingNextPage && (
          <Loader2 size={18} className="text-[#777] animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div style={{ ...style, padding: '8px 16px' }}>
      <AssetCard asset={items[index]} />
    </div>
  );
});

const MobileList = memo(function MobileList({
  items, hasNextPage, isFetchingNextPage, fetchNextPage,
}) {
  const containerRef = useRef(null);
  const [height, setHeight] = useState(600);

  // Measure the container so react-window fills it exactly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    ro.observe(el);
    setHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  // v2: onRowsRendered receives (visibleRange, overscanRange)
  // Load next page when the visible bottom row is near the end of loaded data
  const onRowsRendered = useCallback(({ stopIndex }) => {
    if (hasNextPage && !isFetchingNextPage && stopIndex >= items.length - 3) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, items.length]);

  // +1 slot at the end for the load-more spinner row
  const rowCount = hasNextPage ? items.length + 1 : items.length;

  return (
    <div ref={containerRef} className="h-full">
      {/* react-window v2 API: rowComponent + rowProps instead of children render prop */}
      <List
        defaultHeight={height}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT}
        rowComponent={Row}
        rowProps={{ items, isFetchingNextPage }}
        onRowsRendered={onRowsRendered}
        className="react-window-list"
      />
    </div>
  );
});

// ── Desktop: intersection-observer sentinel for infinite scroll ────────────────
const LoadMoreSentinel = memo(function LoadMoreSentinel({ onVisible }) {
  const { ref } = useInView({
    threshold: 0.1,
    onChange: (inView) => { if (inView) onVisible(); },
  });
  return <div ref={ref} style={{ height: 1 }} aria-hidden="true" />;
});

// ── Empty / Error states ──────────────────────────────────────────────────────
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

// ── Main LedgerView ───────────────────────────────────────────────────────────
/**
 * LedgerView — renders the correct view based on state:
 *   • Loading  → skeleton placeholders (matched to mobile/desktop)
 *   • Error    → retry prompt
 *   • Empty    → no-results message
 *   • Mobile   → react-window List of AssetCards (only visible rows rendered)
 *   • Desktop  → LedgerTable + intersection-observer load-more
 */
const LedgerView = memo(function LedgerView({
  items, total, isLoading, isFetchingNextPage, isError,
  hasNextPage, fetchNextPage, refetch, isMobile,
}) {
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoading) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

  if (isLoading)          return isMobile ? <CardSkeletonList count={6} /> : <TableSkeletonList count={18} />;
  if (isError)            return <ErrorState onRetry={refetch} />;
  if (items.length === 0) return <EmptyState />;

  // Mobile: react-window virtualizes the card list (only visible cards in DOM)
  if (isMobile) {
    return (
      <MobileList
        items={items}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
      />
    );
  }

  // Desktop: full table + sentinel-based pagination
  return (
    <div className="overflow-x-auto overflow-y-auto h-full">
      <LedgerTable items={items} />

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

export default LedgerView;
