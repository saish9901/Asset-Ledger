import React, { memo } from 'react';
import { formatCurrency, formatDate } from '../utils.js';

const STATUS_STYLES = {
  Active:        'bg-[#0e2a1e] text-[#3d9970] border-[#1a4a32]',
  Inactive:      'bg-[#1a1a1a] text-[#999]    border-[#2a2a2a]',
  Pending:       'bg-[#2a2000] text-[#b5890a] border-[#4a3800]',
  Liquidated:    'bg-[#2a0a0a] text-[#c0392b] border-[#4a1010]',
  'Under Review':'bg-[#0a1a2a] text-[#2980b9] border-[#1a3a5a]',
};

const TYPE_ABBREV = {
  'Equity': 'EQ', 'Fixed Income': 'FI', 'Real Estate': 'RE',
  'Commodity': 'CM', 'Private Equity': 'PE', 'Hedge Fund': 'HF',
  'Infrastructure': 'IF', 'Cryptocurrency': 'CR', 'Treasury Bond': 'TB',
  'Corporate Bond': 'CB', 'Derivative': 'DV', 'Mutual Fund': 'MF',
};

const AssetCard = memo(function AssetCard({ asset }) {
  const statusStyle = STATUS_STYLES[asset.status] ?? STATUS_STYLES['Inactive'];
  const typeAbbrev = TYPE_ABBREV[asset.type] ?? asset.type.slice(0, 2).toUpperCase();

  return (
    <article
      className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 space-y-3 fade-in
        hover:border-[#2a2a2a] hover:bg-[#141414] transition-all duration-150 cursor-default"
      aria-label={`Asset ${asset.id}`}
    >
      {/* Row 1: ID + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[10px] text-[#777] tracking-wider">{asset.id}</span>
            <span className="bg-[#1a1a1a] border border-[#222] text-[#999] text-[9px] font-bold rounded px-1 py-0.5 leading-none font-mono">
              {typeAbbrev}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-white leading-tight line-clamp-1">
            {asset.name}
          </h3>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-semibold rounded-full px-2.5 py-1 border leading-none font-mono ${statusStyle}`}>
          {asset.status}
        </span>
      </div>

      {/* Row 2: Grid info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <div>
          <p className="text-[10px] text-[#777] font-mono uppercase tracking-wider mb-0.5">Owner</p>
          <p className="text-xs text-[#ccc] line-clamp-1">{asset.owner}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#777] font-mono uppercase tracking-wider mb-0.5">Type</p>
          <p className="text-xs text-[#ccc] line-clamp-1">{asset.type}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#777] font-mono uppercase tracking-wider mb-0.5">Country</p>
          <p className="text-xs text-[#ccc] line-clamp-1">{asset.country}</p>
        </div>
        <div>
          <p className="text-[10px] text-[#777] font-mono uppercase tracking-wider mb-0.5">Acquired</p>
          <p className="text-xs text-[#ccc] font-mono">{formatDate(asset.acquisitionDate)}</p>
        </div>
      </div>

      {/* Row 3: Valuation */}
      <div className="pt-2.5 border-t border-[#181818] flex items-center justify-between">
        <span className="text-[10px] text-[#777] font-mono uppercase tracking-wider">Valuation</span>
        <span className="text-sm font-bold text-white font-mono tracking-tight">
          {formatCurrency(asset.valuation)}
        </span>
      </div>
    </article>
  );
});

export default AssetCard;
