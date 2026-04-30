import React, { memo } from 'react';
import { Activity, LayoutGrid } from 'lucide-react';

const Navbar = memo(function Navbar() {
  return (
    <header
      className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-[#1a1a1a]"
      role="banner"
    >
      <div className="max-w-screen px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
            <LayoutGrid size={14} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight leading-none block">
              Global Asset Ledger
            </span>
            <span className="text-[#777] text-[10px] font-mono tracking-widest uppercase leading-none block mt-0.5">
              Enterprise Platform
            </span>
          </div>
        </div>

        {/* Right side — UTC timestamp */}
        <div className="hidden md:flex items-center gap-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-1.5">
          <Activity size={12} className="text-[#bbb]" />
          <span className="text-[#bbb] text-xs font-mono">
            {new Date().toUTCString().slice(0, 16)} UTC
          </span>
        </div>
      </div>
    </header>
  );
});

export default Navbar;
