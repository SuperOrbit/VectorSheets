import React from 'react';
import type { HistoryEntry } from '../types';

interface SidebarProps {
  isDarkMode: boolean;
  onReset: () => void;
  history: HistoryEntry[];
  showHistory: boolean;
  onCloseHistory: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isDarkMode, onReset, history, showHistory, onCloseHistory }) => {
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#252526] flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-[#2d2d2d]">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Explorer</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Files Section */}
        <div className="p-2">
          <div className="px-3 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] cursor-pointer rounded transition-colors">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-medium">sales_data.csv</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">Modified now</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className="border-t border-gray-200 dark:border-[#2d2d2d] mt-2">
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-[#2d2d2d]">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">History</h4>
              <button onClick={onCloseHistory} className="p-1 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {history.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No history yet
                </div>
              ) : (
                history.map((entry) => (
                  <div
                    key={entry.id}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#2d2d2d] rounded transition-colors cursor-pointer"
                  >
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium">{entry.description}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatTimestamp(entry.timestamp)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-[#2d2d2d] p-3 space-y-2">
        <button
          onClick={onReset}
          className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset Data
        </button>
        <button className="w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
};
