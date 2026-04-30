import React, { memo } from 'react';

/** Generic shimmer block. Pass className to control size and shape. */
export const SkeletonBlock = memo(function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
});

/** Skeleton for a single mobile asset card. */
export const AssetCardSkeleton = memo(function AssetCardSkeleton() {
  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-4 space-y-3" aria-hidden="true">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-32 rounded" />
          <SkeletonBlock className="h-3 w-20 rounded" />
        </div>
        <SkeletonBlock className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="space-y-1">
          <SkeletonBlock className="h-2.5 w-12 rounded" />
          <SkeletonBlock className="h-3.5 w-24 rounded" />
        </div>
        <div className="space-y-1">
          <SkeletonBlock className="h-2.5 w-12 rounded" />
          <SkeletonBlock className="h-3.5 w-20 rounded" />
        </div>
        <div className="space-y-1">
          <SkeletonBlock className="h-2.5 w-12 rounded" />
          <SkeletonBlock className="h-3.5 w-16 rounded" />
        </div>
        <div className="space-y-1">
          <SkeletonBlock className="h-2.5 w-16 rounded" />
          <SkeletonBlock className="h-3.5 w-24 rounded" />
        </div>
      </div>
      <div className="pt-1 border-t border-[#181818]">
        <SkeletonBlock className="h-5 w-28 rounded" />
      </div>
    </div>
  );
});

/** Skeleton for a single desktop table row. */
export const TableRowSkeleton = memo(function TableRowSkeleton() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 border-b border-[#111] h-[56px]"
      aria-hidden="true"
    >
      <SkeletonBlock className="h-3 w-24 rounded flex-shrink-0" />
      <SkeletonBlock className="h-3 w-40 rounded flex-1 min-w-0" />
      <SkeletonBlock className="h-3 w-24 rounded flex-shrink-0 hidden sm:block" />
      <SkeletonBlock className="h-3 w-28 rounded flex-shrink-0 hidden md:block" />
      <SkeletonBlock className="h-3 w-20 rounded flex-shrink-0 hidden lg:block" />
      <SkeletonBlock className="h-3 w-20 rounded flex-shrink-0 hidden xl:block" />
      <SkeletonBlock className="h-3 w-28 rounded flex-shrink-0" />
      <SkeletonBlock className="h-5 w-16 rounded-full flex-shrink-0" />
    </div>
  );
});

/** Renders N mobile card skeletons. */
export function CardSkeletonList({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-3 p-4">
      {Array.from({ length: count }, (_, i) => (
        <AssetCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Renders N desktop table row skeletons. */
export function TableSkeletonList({ count = 15 }) {
  return (
    <div>
      {Array.from({ length: count }, (_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}
