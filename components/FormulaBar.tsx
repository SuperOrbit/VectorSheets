import React, { useState } from 'react';

interface FormulaBarProps {
  selectedCell: string;
  cellValue: string;
  onCellChange: (value: string) => void;
}

export const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCell, cellValue, onCellChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(cellValue);

  return (
    <div className="flex items-center px-4 py-2 border-b border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#252526] gap-3">
      {/* Cell Reference */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={selectedCell}
          readOnly
          className="w-20 px-2 py-1 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-[#1e1e1e] text-center"
        />
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      </div>

      {/* Formula Input */}
      <div className="flex-1 flex items-center border border-gray-200 dark:border-gray-700 rounded px-3 py-1.5 bg-white dark:bg-[#1e1e1e]">
        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false);
            onCellChange(value);
          }}
          placeholder="Enter value or formula..."
          className="flex-1 text-sm bg-transparent outline-none"
        />
      </div>
    </div>
  );
};
