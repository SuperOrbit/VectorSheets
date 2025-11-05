import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { SpreadsheetRow, FilterState, SortState, CellSelection } from '../types';

interface SpreadsheetViewProps {
  data: SpreadsheetRow[];
  onUpdateData: (rowIndex: number, columnId: keyof SpreadsheetRow, value: string) => void;
  isDarkMode: boolean;
  filterState: FilterState;
  sortState: SortState;
  searchQuery: string;
  selectedCells: CellSelection | null;
  onSelectCells: (selection: CellSelection | null) => void;
}

interface CellCoord {
  row: number;
  col: string;
}

const SpreadsheetViewComponent: React.FC<SpreadsheetViewProps> = ({
  data,
  onUpdateData,
  isDarkMode,
  filterState,
  sortState,
  searchQuery,
  selectedCells,
  onSelectCells,
}) => {
  // ========== State Management ==========
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [editValue, setEditValue] = useState('');
  const [multiSelectStart, setMultiSelectStart] = useState<CellCoord | null>(null);
  const [multiSelectEnd, setMultiSelectEnd] = useState<CellCoord | null>(null);
  const [selectedRange, setSelectedRange] = useState<Set<string>>(new Set());
  const [copiedCells, setCopiedCells] = useState<SpreadsheetRow[] | null>(null);
  const [clipboard, setClipboard] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cell: CellCoord } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [frozenColumns, setFrozenColumns] = useState<number>(1);

  const tableRef = useRef<HTMLTableElement>(null);
  const cellRefs = useRef<Record<string, HTMLDivElement>>({});

  // ========== Memoized Values ==========
  const statistics = useMemo(() => ({
    totalRows: data.length,
    totalSales: data.reduce((sum, row) => sum + row.sales, 0),
    totalCost: data.reduce((sum, row) => sum + row.cost, 0),
    totalProfit: data.reduce((sum, row) => sum + row.profit, 0),
  }), [data]);

  const columns = useMemo(() => 
    data.length > 0 ? Object.keys(data[0]) : [], 
    [data]
  );

  const cellKey = (row: number, col: string) => `${row}-${col}`;

  // ========== Formatting Functions ==========
  const formatValue = useCallback((key: string, value: any): string => {
    if (['sales', 'cost', 'profit'].includes(key)) {
      return `$${Number(value).toLocaleString()}`;
    }
    return String(value || '');
  }, []);

  const highlightSearchMatch = useCallback((text: string, query: string): React.ReactNode => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <span key={i} className="bg-yellow-300 dark:bg-yellow-600 font-bold px-1">{part}</span>
        : part
    );
  }, []);

  // ========== Cell Selection Functions ==========
  
  const handleCellMouseDown = useCallback((row: number, col: string, e: React.MouseEvent) => {
    e.preventDefault();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-select with Ctrl/Cmd
      const key = cellKey(row, col);
      setSelectedRange(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    } else if (e.shiftKey && multiSelectStart) {
      // Range select with Shift
      setMultiSelectEnd({ row, col });
      updateRangeSelection({ row, col });
    } else {
      // Single select
      setMultiSelectStart({ row, col });
      setMultiSelectEnd(null);
      setSelectedRange(new Set([cellKey(row, col)]));
    }
  }, [multiSelectStart]);

  const updateRangeSelection = useCallback((endCoord: CellCoord) => {
    if (!multiSelectStart) return;

    const newSet = new Set<string>();
    const startRow = Math.min(multiSelectStart.row, endCoord.row);
    const endRow = Math.max(multiSelectStart.row, endCoord.row);
    const startColIdx = columns.indexOf(multiSelectStart.col);
    const endColIdx = columns.indexOf(endCoord.col);
    const minColIdx = Math.min(startColIdx, endColIdx);
    const maxColIdx = Math.max(startColIdx, endColIdx);

    for (let row = startRow; row <= endRow; row++) {
      for (let colIdx = minColIdx; colIdx <= maxColIdx; colIdx++) {
        newSet.add(cellKey(row, columns[colIdx]));
      }
    }

    setSelectedRange(newSet);
  }, [multiSelectStart, columns]);

  // ========== Cell Editing ==========
  
  const handleCellClick = useCallback((row: number, col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      // Double click to edit
      setEditingCell({ row, col });
      setEditValue(String(data[row][col] || ''));
    }
  }, [data]);

  const handleCellChange = useCallback((e: React.FocusEvent<HTMLDivElement>, row: number, col: keyof SpreadsheetRow) => {
    const newValue = e.currentTarget.textContent || '';
    const cleanValue = newValue.replace(/\n/g, '');
    onUpdateData(row, col, cleanValue);
    setEditingCell(null);
  }, [onUpdateData]);

  const handleEditInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  }, []);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (editingCell) {
        const col = editingCell.col as keyof SpreadsheetRow;
        onUpdateData(editingCell.row, col, editValue);
        
        // Move to next row
        const nextRow = editingCell.row + 1;
        if (nextRow < data.length) {
          setEditingCell({ row: nextRow, col: editingCell.col });
          setEditValue(String(data[nextRow][col] || ''));
        } else {
          setEditingCell(null);
        }
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (editingCell) {
        const col = editingCell.col as keyof SpreadsheetRow;
        onUpdateData(editingCell.row, col, editValue);
        
        // Move to next column
        const currentColIdx = columns.indexOf(editingCell.col);
        const nextColIdx = currentColIdx + 1;
        if (nextColIdx < columns.length) {
          const nextCol = columns[nextColIdx];
          setEditingCell({ row: editingCell.row, col: nextCol });
          setEditValue(String(data[editingCell.row][nextCol] || ''));
        } else {
          setEditingCell(null);
        }
      }
    }
  }, [editingCell, editValue, data, columns, onUpdateData]);

  // ========== Keyboard Shortcuts ==========
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedRange.size && !multiSelectStart) return;

      // Copy (Ctrl/Cmd + C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }

      // Paste (Ctrl/Cmd + V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }

      // Cut (Ctrl/Cmd + X)
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }

      // Select All (Ctrl/Cmd + A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange, multiSelectStart, data, columns]);

  // ========== Clipboard Operations ==========
  
  const handleCopy = useCallback(() => {
    if (selectedRange.size === 0) return;

    const rows: Array<Record<string, any>> = [];
    const cellArray = Array.from(selectedRange);
    
    cellArray.forEach(key => {
      const [rowStr, col] = key.split('-');
      const row = parseInt(rowStr);
      
      if (!rows[row]) rows[row] = {};
      rows[row][col] = data[row][col];
    });

    const csv = rows.map(row => 
      columns.map(col => row[col] || '').join('\t')
    ).join('\n');

    setClipboard(csv);
    setCopiedCells(rows as any);

    // Also copy to system clipboard
    navigator.clipboard.writeText(csv).catch(console.error);

    console.log('📋 Copied to clipboard');
  }, [selectedRange, data, columns]);

  const handleCut = useCallback(() => {
    handleCopy();
    handleDelete();
  }, [selectedRange]);

  const handlePaste = useCallback(() => {
    if (clipboard && multiSelectStart) {
      const lines = clipboard.split('\n');
      const updates: Array<{ rowIndex: number; column: string; value: any }> = [];

      lines.forEach((line, lineIdx) => {
        const values = line.split('\t');
        const rowIdx = multiSelectStart.row + lineIdx;

        if (rowIdx < data.length) {
          values.forEach((value, colIdx) => {
            const col = columns[colIdx];
            if (col && value) {
              updates.push({
                rowIndex: rowIdx,
                column: col,
                value: isNaN(Number(value)) ? value : Number(value)
              });
            }
          });
        }
      });

      // Apply batch update
      updates.forEach(update => {
        onUpdateData(update.rowIndex, update.column as keyof SpreadsheetRow, update.value);
      });

      console.log('📝 Pasted', updates.length, 'cells');
    } else {
      navigator.clipboard.readText().then(text => {
        setClipboard(text);
      }).catch(console.error);
    }
  }, [clipboard, multiSelectStart, data, columns, onUpdateData]);

  const handleDelete = useCallback(() => {
    selectedRange.forEach(key => {
      const [rowStr, col] = key.split('-');
      const row = parseInt(rowStr);
      onUpdateData(row, col as keyof SpreadsheetRow, '');
    });

    console.log('🗑️ Deleted', selectedRange.size, 'cells');
  }, [selectedRange, onUpdateData]);

  const selectAll = useCallback(() => {
    const allCells = new Set<string>();
    data.forEach((_, row) => {
      columns.forEach(col => {
        allCells.add(cellKey(row, col));
      });
    });
    setSelectedRange(allCells);
    console.log('✅ Selected all', allCells.size, 'cells');
  }, [data, columns]);

  // ========== Context Menu ==========
  
  const handleContextMenu = (e: React.MouseEvent, row: number, col: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, cell: { row, col } });
  };

  // ========== Column Operations ==========
  
  const handleColumnResize = (col: string, newWidth: number) => {
    setColumnWidths(prev => ({ ...prev, [col]: newWidth }));
  };

  // ========== Render Functions ==========
  
  const renderCell = (row: number, col: string) => {
    const cellId = cellKey(row, col);
    const isSelected = selectedRange.has(cellId);
    const isEditing = editingCell?.row === row && editingCell?.col === col;
    const value = data[row][col];

    return (
      <td
        key={cellId}
        className={`px-4 py-2 border-r border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 min-w-[120px] max-w-[300px] relative cursor-cell transition-colors ${
          isSelected 
            ? 'bg-blue-200 dark:bg-blue-900 border-blue-400' 
            : 'hover:bg-gray-100 dark:hover:bg-[#2d2d2d]'
        }`}
        onMouseDown={(e) => handleCellMouseDown(row, col, e)}
        onContextMenu={(e) => handleContextMenu(e, row, col)}
      >
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={handleEditInputChange}
            onKeyDown={handleEditKeyDown}
            className="w-full px-2 py-1 bg-white dark:bg-[#1e1e1e] border border-blue-500 rounded outline-none text-gray-900 dark:text-white"
          />
        ) : (
          <div
            ref={(el) => { if (el) cellRefs.current[cellId] = el; }}
            contentEditable={false}
            onDoubleClick={(e) => handleCellClick(row, col, e)}
            className="outline-none select-none break-words"
          >
            {highlightSearchMatch(formatValue(col, value), searchQuery)}
          </div>
        )}
      </td>
    );
  };

  // ========== Main Render ==========
  
  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'dark' : ''}`}>
      {/* Statistics Bar */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#2d2d2d] px-4 py-3">
        <div className="grid grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400">📊 Rows:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">{statistics.totalRows}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">💰 Sales:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">${statistics.totalSales.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">💸 Cost:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">${statistics.totalCost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">📈 Profit:</span>
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">${statistics.totalProfit.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">🎯 Selected:</span>
            <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{selectedRange.size}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto scrollbar-custom">
        <table
          ref={tableRef}
          className="w-full border-collapse text-sm bg-white dark:bg-[#1e1e1e]"
        >
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#2d2d2d] border-b-2 border-gray-300 dark:border-gray-700">
            <tr>
              <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#2d2d2d] sticky left-0 z-20">
                #
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 min-w-[120px] bg-gray-100 dark:bg-[#2d2d2d] sticky top-0 z-10 group"
                >
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    {sortState.column === col && (
                      <span className="ml-2 text-blue-600 dark:text-blue-400">
                        {sortState.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  📭 No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-[#2d2d2d]/50 transition-colors"
                >
                  {/* Row Number */}
                  <td className="w-12 px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-700 sticky left-0 z-5">
                    {rowIndex + 1}
                  </td>

                  {/* Cells */}
                  {columns.map(col => renderCell(rowIndex, col))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {data.length > 0 && (
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#2d2d2d] bg-gray-50 dark:bg-[#2d2d2d] px-4 py-2 text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
          <div>
            📊 Showing {data.length} row{data.length !== 1 ? 's' : ''} • 📋 {selectedRange.size} cell{selectedRange.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-4">
            <span>💡 Double-click to edit • Ctrl+C to copy • Ctrl+V to paste</span>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => { handleCopy(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300"
          >
            📋 Copy
          </button>
          <button
            onClick={() => { handleCut(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300"
          >
            ✂️ Cut
          </button>
          <button
            onClick={() => { handlePaste(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 dark:hover:bg-[#3d3d3d] text-gray-700 dark:text-gray-300"
          >
            📝 Paste
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700"></div>
          <button
            onClick={() => { handleDelete(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const SpreadsheetView = React.memo(SpreadsheetViewComponent);