import React, { memo, useCallback } from 'react';
import { X, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { useLedgerStore } from '../../store/ledgerStore.js';
import { ALL_COUNTRIES, ALL_ASSET_TYPES, ALL_STATUSES, ALL_REGIONS } from '../../services/mockData.js';

const SORT_OPTIONS = [
  { value: 'valuation_desc', label: 'Highest Valuation' },
  { value: 'valuation_asc', label: 'Lowest Valuation' },
  { value: 'date_desc', label: 'Latest Acquisition' },
  { value: 'date_asc', label: 'Earliest Acquisition' },
  { value: 'name_asc', label: 'Name A → Z' },
  { value: 'name_desc', label: 'Name Z → A' },
];

// Shared select field
const SelectField = memo(function SelectField({ id, label, value, onChange, options, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
        {label}
      </label>
      <select
        id={id}
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
          focus:outline-none focus:border-[#3a3a3a] transition-colors appearance-none cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
});

// Shared number input
const NumberInput = memo(function NumberInput({ id, label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder={placeholder}
        className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-base sm:text-sm text-white
          placeholder-[#555] focus:outline-none focus:border-[#3a3a3a] transition-colors font-mono"
      />
    </div>
  );
});

// ── Desktop / Sidebar Filter Panel (instant apply) ────────────────────────────
export const FilterPanel = memo(function FilterPanel({ onClose }) {
  const filters = useLedgerStore((s) => s.filters);
  const setFilter = useLedgerStore((s) => s.setFilter);
  const resetFilters = useLedgerStore((s) => s.resetFilters);
  const sort = useLedgerStore((s) => s.sort);
  const setSort = useLedgerStore((s) => s.setSort);
  const activeCount = useLedgerStore((s) => s.activeFilterCount);

  const handleReset = useCallback(() => {
    resetFilters();
    setSort('valuation_desc');
  }, [resetFilters, setSort]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#999]" />
          <span className="text-sm font-semibold text-white">Filters &amp; Sort</span>
          {activeCount > 0 && (
            <span className="bg-white text-black text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-[#bbb] hover:text-white text-xs flex items-center gap-1 transition-colors"
            aria-label="Reset all filters"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#bbb] hover:text-white transition-colors ml-1"
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {/* Sort */}
        <div className="space-y-1.5">
          <label htmlFor="sort-select" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Sort By
          </label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
              focus:outline-none focus:border-[#3a3a3a] transition-colors appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="h-px bg-[#111]" />

        <SelectField id="filter-type" label="Asset Type" value={filters.type}
          onChange={(v) => setFilter('type', v || '')} options={ALL_ASSET_TYPES} placeholder="All Types" />
        <SelectField id="filter-status" label="Status" value={filters.status}
          onChange={(v) => setFilter('status', v || '')} options={ALL_STATUSES} placeholder="All Statuses" />
        <SelectField id="filter-region" label="Region" value={filters.region}
          onChange={(v) => setFilter('region', v || '')} options={ALL_REGIONS} placeholder="All Regions" />
        <SelectField id="filter-country" label="Country" value={filters.country}
          onChange={(v) => setFilter('country', v || '')} options={ALL_COUNTRIES} placeholder="All Countries" />

        <div className="h-px bg-[#111]" />

        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Valuation Range (USD)
          </span>
          <NumberInput id="filter-val-min" label="Minimum" value={filters.valuationMin}
            onChange={(v) => setFilter('valuationMin', v)} placeholder="0" />
          <NumberInput id="filter-val-max" label="Maximum" value={filters.valuationMax}
            onChange={(v) => setFilter('valuationMax', v)} placeholder="999,000,000" />
        </div>

        <div className="h-px bg-[#111]" />

        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Acquisition Date
          </span>
          <div className="space-y-1.5">
            <label htmlFor="filter-date-from" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">From</label>
            <input id="filter-date-from" type="date" value={filters.dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
                focus:outline-none focus:border-[#3a3a3a] transition-colors font-mono [color-scheme:dark]" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="filter-date-to" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">To</label>
            <input id="filter-date-to" type="date" value={filters.dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
                focus:outline-none focus:border-[#3a3a3a] transition-colors font-mono [color-scheme:dark]" />
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Mobile Drawer Filter Panel (staged — Apply to commit) ─────────────────────
const MobileFilterPanel = memo(function MobileFilterPanel({ onClose }) {
  const draftFilters = useLedgerStore((s) => s.draftFilters);
  const draftSort = useLedgerStore((s) => s.draftSort);
  const setDraftFilter = useLedgerStore((s) => s.setDraftFilter);
  const setDraftSort = useLedgerStore((s) => s.setDraftSort);
  const resetDraftFilters = useLedgerStore((s) => s.resetDraftFilters);
  const applyDraftFilters = useLedgerStore((s) => s.applyDraftFilters);

  const handleReset = useCallback(() => {
    resetDraftFilters();
  }, [resetDraftFilters]);

  const handleApply = useCallback(() => {
    applyDraftFilters(); // commits draft → live + closes drawer
  }, [applyDraftFilters]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-[#999]" />
          <span className="text-sm font-semibold text-white">Filters &amp; Sort</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="text-[#bbb] hover:text-white text-xs flex items-center gap-1 transition-colors"
            aria-label="Reset all filters"
          >
            <RotateCcw size={11} />
            Reset
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#bbb] hover:text-white transition-colors ml-1"
              aria-label="Close filters"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {/* Sort */}
        <div className="space-y-1.5">
          <label htmlFor="m-sort-select" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Sort By
          </label>
          <select
            id="m-sort-select"
            value={draftSort}
            onChange={(e) => setDraftSort(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-base sm:text-sm text-white
              focus:outline-none focus:border-[#3a3a3a] transition-colors appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="h-px bg-[#111]" />

        <SelectField id="m-filter-type" label="Asset Type" value={draftFilters.type}
          onChange={(v) => setDraftFilter('type', v || '')} options={ALL_ASSET_TYPES} placeholder="All Types" />
        <SelectField id="m-filter-status" label="Status" value={draftFilters.status}
          onChange={(v) => setDraftFilter('status', v || '')} options={ALL_STATUSES} placeholder="All Statuses" />
        <SelectField id="m-filter-region" label="Region" value={draftFilters.region}
          onChange={(v) => setDraftFilter('region', v || '')} options={ALL_REGIONS} placeholder="All Regions" />
        <SelectField id="m-filter-country" label="Country" value={draftFilters.country}
          onChange={(v) => setDraftFilter('country', v || '')} options={ALL_COUNTRIES} placeholder="All Countries" />

        <div className="h-px bg-[#111]" />

        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Valuation Range (USD)
          </span>
          <NumberInput id="m-filter-val-min" label="Minimum" value={draftFilters.valuationMin}
            onChange={(v) => setDraftFilter('valuationMin', v)} placeholder="0" />
          <NumberInput id="m-filter-val-max" label="Maximum" value={draftFilters.valuationMax}
            onChange={(v) => setDraftFilter('valuationMax', v)} placeholder="999,000,000" />
        </div>

        <div className="h-px bg-[#111]" />

        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">
            Acquisition Date
          </span>
          <div className="space-y-1.5">
            <label htmlFor="m-filter-date-from" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">From</label>
            <input id="m-filter-date-from" type="date" value={draftFilters.dateFrom}
              onChange={(e) => setDraftFilter('dateFrom', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
                focus:outline-none focus:border-[#3a3a3a] transition-colors font-mono [color-scheme:dark]" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="m-filter-date-to" className="text-[10px] uppercase tracking-widest text-[#bbb] font-mono block">To</label>
            <input id="m-filter-date-to" type="date" value={draftFilters.dateTo}
              onChange={(e) => setDraftFilter('dateTo', e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white
                focus:outline-none focus:border-[#3a3a3a] transition-colors font-mono [color-scheme:dark]" />
          </div>
        </div>
      </div>

      {/* Apply Filters button — sticky at bottom */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
        <button
          id="apply-filters-btn"
          onClick={handleApply}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-sm font-semibold
            rounded-xl py-3 hover:bg-[#e8e8e8] active:scale-[0.98] transition-all duration-150"
        >
          <Check size={15} />
          Apply Filters
        </button>
      </div>
    </div>
  );
});

// ── Mobile bottom-sheet drawer ────────────────────────────────────────────────
const FilterDrawer = memo(function FilterDrawer() {
  const isOpen = useLedgerStore((s) => s.isFilterDrawerOpen);
  const close = useLedgerStore((s) => s.closeFilterDrawer);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed inset-x-0 bottom-0 z-50 bg-[#0a0a0a] border-t border-[#1f1f1f] rounded-t-2xl
          transition-transform duration-300 ease-out lg:hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          max-h-[85dvh] flex flex-col overflow-hidden`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#2a2a2a]" />
        </div>
        <MobileFilterPanel onClose={close} />
      </div>
    </>
  );
});

export default FilterDrawer;
