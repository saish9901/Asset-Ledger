import React, { memo, useCallback, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatCurrency.js';
import { useLedgerStore } from '../../store/ledgerStore.js';

const STATUS_STYLES = {
  Active:        'bg-[#0e2a1e] text-[#3d9970] border-[#1a4a32]',
  Inactive:      'bg-[#1a1a1a] text-[#999]    border-[#2a2a2a]',
  Pending:       'bg-[#2a2000] text-[#b5890a] border-[#4a3800]',
  Liquidated:    'bg-[#2a0a0a] text-[#c0392b] border-[#4a1010]',
  'Under Review':'bg-[#0a1a2a] text-[#2980b9] border-[#1a3a5a]',
};

const SORT_MAP = {
  name:            ['name_asc', 'name_desc'],
  valuation:       ['valuation_desc', 'valuation_asc'],
  acquisitionDate: ['date_desc', 'date_asc'],
};

const SortIcon = memo(function SortIcon({ col, sort }) {
  const [asc, desc] = SORT_MAP[col] ?? [];
  if (sort === asc) return <ChevronUp size={12} className="text-white" />;
  if (sort === desc) return <ChevronDown size={12} className="text-white" />;
  return <ChevronsUpDown size={12} className="text-[#999]" />;
});

const ColHeader = memo(function ColHeader({ col, label, sortable, sort, onSort, className = '' }) {
  const active = sortable && (sort === SORT_MAP[col]?.[0] || sort === SORT_MAP[col]?.[1]);
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest whitespace-nowrap
        ${active ? 'text-white' : 'text-[#777]'}
        ${sortable ? 'cursor-pointer select-none hover:text-[#bbb] transition-colors' : ''}
        ${className}`}
      onClick={sortable ? () => onSort(col) : undefined}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortable && <SortIcon col={col} sort={sort} />}
      </div>
    </th>
  );
});

const TableRow = memo(function TableRow({ asset, even }) {
  const statusStyle = STATUS_STYLES[asset.status] ?? STATUS_STYLES['Inactive'];
  return (
    <tr
      className={`border-b border-[#0f0f0f] hover:bg-[#151515] transition-colors duration-100 group
        ${even ? 'bg-[#0a0a0a]' : 'bg-[#080808]'}`}
    >
      <td className="px-4 py-3 font-mono text-[11px] text-[#bbb] whitespace-nowrap">
        {asset.id}
      </td>
      <td className="px-4 py-3 max-w-[200px]">
        <span className="text-sm text-white font-medium line-clamp-1 block">{asset.name}</span>
      </td>
      <td className="px-4 py-3 text-xs text-[#bbb] whitespace-nowrap hidden sm:table-cell">
        {asset.type}
      </td>
      <td className="px-4 py-3 text-xs text-[#bbb] whitespace-nowrap hidden md:table-cell max-w-[160px]">
        <span className="block line-clamp-1">{asset.owner}</span>
      </td>
      <td className="px-4 py-3 text-xs text-[#bbb] whitespace-nowrap hidden lg:table-cell">
        {asset.country}
      </td>
      <td className="px-4 py-3 text-xs text-[#bbb] whitespace-nowrap hidden xl:table-cell font-mono">
        {asset.region}
      </td>
      <td className="px-4 py-3 text-sm font-mono font-semibold text-white whitespace-nowrap text-right">
        {formatCurrency(asset.valuation)}
      </td>
      <td className="px-4 py-3 text-xs text-[#999] font-mono whitespace-nowrap hidden lg:table-cell">
        {formatDate(asset.acquisitionDate)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span className={`text-[10px] font-semibold rounded-full px-2.5 py-1 border leading-none font-mono ${statusStyle}`}>
          {asset.status}
        </span>
      </td>
    </tr>
  );
});

const LedgerTable = memo(function LedgerTable({ items }) {
  const sort = useLedgerStore((s) => s.sort);
  const setSort = useLedgerStore((s) => s.setSort);

  const handleSort = useCallback((col) => {
    const [asc, desc] = SORT_MAP[col] ?? [];
    if (!asc) return;
    setSort(sort === asc ? desc : asc);
  }, [sort, setSort]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse" aria-label="Asset ledger table">
        <thead className="sticky top-0 z-10 bg-[#050505] border-b border-[#1a1a1a]">
          <tr>
            <ColHeader col="id"              label="Asset ID"    sortable={false} sort={sort} onSort={handleSort} />
            <ColHeader col="name"            label="Name"        sortable sort={sort} onSort={handleSort} />
            <ColHeader col="type"            label="Type"        sortable={false} sort={sort} onSort={handleSort} className="hidden sm:table-cell" />
            <ColHeader col="owner"           label="Owner"       sortable={false} sort={sort} onSort={handleSort} className="hidden md:table-cell" />
            <ColHeader col="country"         label="Country"     sortable={false} sort={sort} onSort={handleSort} className="hidden lg:table-cell" />
            <ColHeader col="region"          label="Region"      sortable={false} sort={sort} onSort={handleSort} className="hidden xl:table-cell" />
            <ColHeader col="valuation"       label="Valuation"   sortable sort={sort} onSort={handleSort} className="text-right" />
            <ColHeader col="acquisitionDate" label="Acquired"    sortable sort={sort} onSort={handleSort} className="hidden lg:table-cell" />
            <ColHeader col="status"          label="Status"      sortable={false} sort={sort} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {items.map((asset, idx) => (
            <TableRow key={asset.id} asset={asset} even={idx % 2 === 0} />
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default LedgerTable;

