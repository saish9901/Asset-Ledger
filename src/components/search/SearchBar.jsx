import React, { memo, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useLedgerStore } from '../../store/ledgerStore.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const SearchBar = memo(function SearchBar() {
  const searchQuery = useLedgerStore((s) => s.searchQuery);
  const setSearchQuery = useLedgerStore((s) => s.setSearchQuery);
  const debouncedSearch = useDebounce(searchQuery, 350);
  const isSearching = searchQuery !== debouncedSearch;

  const handleChange = useCallback(
    (e) => setSearchQuery(e.target.value),
    [setSearchQuery]
  );

  const handleClear = useCallback(() => setSearchQuery(''), [setSearchQuery]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setSearchQuery('');
  }, [setSearchQuery]);

  return (
    <div className="relative w-full">
      {/* Icon left */}
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        {isSearching ? (
          <Loader2
            size={16}
            className="text-[#bbb] animate-spin"
            aria-hidden="true"
          />
        ) : (
          <Search size={16} className="text-[#bbb]" aria-hidden="true" />
        )}
      </div>

      <input
        id="global-search"
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={searchQuery}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Search assets, IDs, owners, countries…"
        aria-label="Search assets"
        className={[
          'w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg',
          'pl-10 pr-10 py-2.5',
          'text-sm text-white placeholder-[#666]',
          'focus:outline-none focus:border-[#3a3a3a] focus:bg-[#111]',
          'transition-all duration-200',
          'font-mono tracking-tight',
        ].join(' ')}
      />

      {/* Clear button */}
      {searchQuery && (
        <button
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#bbb] hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});

export default SearchBar;

