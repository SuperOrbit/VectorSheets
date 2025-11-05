import React, { useState } from 'react';

interface SheetTabsProps {
  sheets: string[];
  activeSheet: string;
  onSheetChange: (sheet: string) => void;
  onAddSheet: () => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({ sheets, activeSheet, onSheetChange, onAddSheet }) => {
  return (
    <div className="flex items-center border-t border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#252526] h-10">
      {/* Navigation Buttons */}
      <div className="flex items-center px-2 border-r border-gray-200 dark:border-gray-700">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Sheet Tabs */}
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-none">
        {sheets.map((sheet) => (
          <button
            key={sheet}
            onClick={() => onSheetChange(sheet)}
            className={`px-4 py-2 text-sm font-medium border-r border-gray-200 dark:border-gray-700 transition-colors ${
              activeSheet === sheet
                ? 'bg-gray-50 dark:bg-[#1e1e1e] text-gray-900 dark:text-white border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2d2d2d]'
            }`}
          >
            {sheet}
          </button>
        ))}
        <button
          onClick={onAddSheet}
          className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors ml-2"
          title="Add sheet"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Info Button */}
      <div className="px-2 border-l border-gray-200 dark:border-gray-700">
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};
