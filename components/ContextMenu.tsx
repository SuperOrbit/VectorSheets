import React, { useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  // AI Actions
  onExplain?: () => void;
  onGenerateFormula?: () => void;
  onSummarize?: () => void;
  hasSelection?: boolean;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ 
  x, 
  y, 
  onClose, 
  onCopy, 
  onPaste, 
  onDelete,
  onExplain,
  onGenerateFormula,
  onSummarize,
  hasSelection = false,
}) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  const menuItems = [
    { icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', label: 'Copy', action: onCopy, shortcut: '⌘C' },
    { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', label: 'Paste', action: onPaste, shortcut: '⌘V' },
    { icon: 'M6 18L18 6M6 6l12 12', label: 'Delete', action: onDelete, shortcut: '⌫', danger: true },
  ];

  const aiMenuItems = hasSelection ? [
    { 
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', 
      label: 'Explain Selection', 
      action: onExplain || (() => {}), 
      ai: true 
    },
    { 
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', 
      label: 'Generate Formula', 
      action: onGenerateFormula || (() => {}), 
      ai: true 
    },
    { 
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 
      label: 'Summarize Selection', 
      action: onSummarize || (() => {}), 
      ai: true 
    },
  ] : [];

  return (
    <div
      className="fixed z-50 w-56 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-lg overflow-hidden"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, index) => (
        <button
          key={index}
          onClick={item.action}
          className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#2d2d2d] transition-colors ${
            item.danger ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>
        </button>
      ))}
      
      {aiMenuItems.length > 0 && (
        <>
          <div className="border-t border-gray-200 dark:border-[#2d2d2d] my-1"></div>
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            AI Actions
          </div>
          {aiMenuItems.map((item, index) => (
            <button
              key={`ai-${index}`}
              onClick={item.action}
              className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};
