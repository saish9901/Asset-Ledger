import React, { memo } from 'react';
import { FilterPanel } from '../filters/FilterDrawer.jsx';

const Sidebar = memo(function Sidebar() {
  return (
    <aside
      className="hidden lg:flex flex-col w-64 xl:w-72 flex-shrink-0 bg-[#080808] border-r border-[#141414] h-full overflow-hidden"
      aria-label="Filter panel"
    >
      <FilterPanel onClose={null} />
    </aside>
  );
});

export default Sidebar;

