import React from 'react';

interface StatusBarProps {
  rowCount: number;
  selectedCount: number;
  filterActive: boolean;
  sortActive: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({ rowCount, selectedCount, filterActive, sortActive }) => {
  return (
    <div className="flex-shrink-0 h-6 border-t border-[#2D2D2D] bg-[#252526] flex items-center px-4 text-xs text-[#9CA3AF]">
      <div className="flex items-center gap-4">
        <span>{rowCount} rows</span>
        {selectedCount > 0 && (
          <>
            <div className="w-px h-3 bg-[#2D2D2D]"></div>
            <span>{selectedCount} selected</span>
          </>
        )}
        {filterActive && (
          <>
            <div className="w-px h-3 bg-[#2D2D2D]"></div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-blue-500">Filtered</span>
            </div>
          </>
        )}
        {sortActive && (
          <>
            <div className="w-px h-3 bg-[#2D2D2D]"></div>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span className="text-blue-500">Sorted</span>
            </div>
          </>
        )}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span>UTF-8</span>
        <span>LF</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
};
