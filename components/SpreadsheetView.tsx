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
  const [isSelecting, setIsSelecting] = useState(false);
  const [multiSelectEnd, setMultiSelectEnd] = useState<CellCoord | null>(null);
  const [selectedRange, setSelectedRange] = useState<Set<string>>(new Set());
  const [copiedCells, setCopiedCells] = useState<SpreadsheetRow[] | null>(null);
  const [clipboard, setClipboard] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; cell: CellCoord } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const [resizingColumn, setResizingColumn] = useState<{ col: string, startX: number, startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ row: number, startY: number, startHeight: number } | null>(null);
  const [frozenColumns, setFrozenColumns] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<CellCoord | null>(null);
  const [dragEnd, setDragEnd] = useState<CellCoord | null>(null);

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
        ? <span key={i} className="bg-yellow-600 font-bold px-1 text-black">{part}</span>
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
      setMultiSelectStart({ row, col });
    } else if (e.shiftKey && multiSelectStart) {
      // Range select with Shift
      setMultiSelectEnd({ row, col });
      updateRangeSelection({ row, col });
    } else {
      // Start drag selection
      setIsDragging(true);
      setDragStart({ row, col });
      setDragEnd({ row, col });
      setMultiSelectStart({ row, col });
      setMultiSelectEnd(null);
      setSelectedRange(new Set([cellKey(row, col)]));
      setIsSelecting(true);
    }
  }, [multiSelectStart, cellKey]);

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
    setMultiSelectEnd(endCoord);
    onSelectCells({
      startRow: multiSelectStart.row,
      startCol: multiSelectStart.col,
      endRow: endCoord.row,
      endCol: endCoord.col,
    });
  }, [multiSelectStart, columns, cellKey, onSelectCells]);

  // ========== Cell Editing ==========
  
  const handleCellClick = useCallback((row: number, col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      // Double click to edit
      setEditingCell({ row, col });
      setEditValue(String(data[row][col] || ''));
    } else if (e.detail === 1) {
      // Single click - just select the cell
      setMultiSelectStart({ row, col });
      setMultiSelectEnd(null);
      setSelectedRange(new Set([cellKey(row, col)]));
      onSelectCells({
        startRow: row,
        startCol: col,
      });
    }
  }, [data, cellKey, onSelectCells]);

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
    // Allow backspace and other editing keys to work normally
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key.length === 1) {
      // Let the input handle these keys normally
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
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
      e.preventDefault();
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

  // ========== Clipboard Operations ==========  
  const handleDelete = useCallback(() => {
    selectedRange.forEach(key => {
      const [rowStr, col] = key.split('-');
      const row = parseInt(rowStr);
      onUpdateData(row, col as keyof SpreadsheetRow, '');
    });

    console.log('🗑️ Deleted', selectedRange.size, 'cells');
  }, [selectedRange, onUpdateData]);

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
  }, [handleCopy, handleDelete]);

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

  const selectAll = useCallback(() => {
    const allCells = new Set<string>();
    data.forEach((_, row) => {
      columns.forEach(col => {
        allCells.add(cellKey(row, col));
      });
    });
    setSelectedRange(allCells);
    console.log('✅ Selected all', allCells.size, 'cells');
  }, [data, columns, cellKey]);

  // ========== Keyboard Navigation ==========
  const navigateCell = useCallback((direction: 'up' | 'down' | 'left' | 'right', extendSelection: boolean = false) => {
    if (!multiSelectStart) {
      // If no selection, start at first cell
      const startCoord = { row: 0, col: columns[0] };
      setMultiSelectStart(startCoord);
      setSelectedRange(new Set([cellKey(0, columns[0])]));
      return;
    }

    let newRow = multiSelectStart.row;
    let newCol = multiSelectStart.col;
    const currentColIdx = columns.indexOf(multiSelectStart.col);

    switch (direction) {
      case 'up':
        newRow = Math.max(0, newRow - 1);
        break;
      case 'down':
        newRow = Math.min(data.length - 1, newRow + 1);
        break;
      case 'left':
        if (currentColIdx > 0) {
          newCol = columns[currentColIdx - 1];
        }
        break;
      case 'right':
        if (currentColIdx < columns.length - 1) {
          newCol = columns[currentColIdx + 1];
        }
        break;
    }

    if (extendSelection && multiSelectStart) {
      updateRangeSelection({ row: newRow, col: newCol });
    } else {
      setMultiSelectStart({ row: newRow, col: newCol });
      setSelectedRange(new Set([cellKey(newRow, newCol)]));
      onSelectCells({
        startRow: newRow,
        startCol: newCol,
      });
    }
  }, [multiSelectStart, columns, data.length, cellKey, updateRangeSelection, onSelectCells]);

  // ========== Keyboard Shortcuts ==========  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere if user is editing a cell or typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Arrow key navigation
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
        navigateCell(direction, e.shiftKey);
        return;
      }

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

      // Delete (only Delete key, not Backspace, to avoid conflicts)
      if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }

      // Select All (Ctrl/Cmd + A)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAll();
      }

      // F2 or Enter to edit selected cell
      if ((e.key === 'F2' || e.key === 'Enter') && multiSelectStart && selectedRange.size === 1) {
        e.preventDefault();
        const cellKey = Array.from(selectedRange)[0];
        const [rowStr, col] = cellKey.split('-');
        const row = parseInt(rowStr);
        setEditingCell({ row, col });
        setEditValue(String(data[row][col] || ''));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange, multiSelectStart, data, columns, handleCopy, handlePaste, handleCut, handleDelete, selectAll, navigateCell]);

  // ========== Drag Selection ==========
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStart && tableRef.current) {
        // Use cell refs to find which cell the mouse is over
        let currentRow = dragStart.row;
        let currentCol = dragStart.col;
        
        // Try to find the cell element under the mouse
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        for (const el of elements) {
          const td = el.closest('td');
          if (td && td.dataset.row !== undefined && td.dataset.col) {
            currentRow = parseInt(td.dataset.row);
            currentCol = td.dataset.col;
            break;
          }
        }
        
        // Clamp to valid ranges
        currentRow = Math.max(0, Math.min(data.length - 1, currentRow));
        const colIdx = columns.indexOf(currentCol);
        if (colIdx === -1) {
          currentCol = dragStart.col;
        }
        
        setDragEnd({ row: currentRow, col: currentCol });
        updateRangeSelection({ row: currentRow, col: currentCol });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSelecting(false);
      setDragStart(null);
      setDragEnd(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, data.length, columns, updateRangeSelection]);

  // ========== Column & Row Resize Operations ==========
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diffX = e.clientX - resizingColumn.startX;
        const newWidth = Math.max(80, resizingColumn.startWidth + diffX); // Minimum width 80px
        setColumnWidths(prev => ({ ...prev, [resizingColumn.col]: newWidth }));
      }
      if (resizingRow) {
        const diffY = e.clientY - resizingRow.startY;
        const newHeight = Math.max(20, resizingRow.startHeight + diffY); // Minimum height 20px
        setRowHeights(prev => ({ ...prev, [resizingRow.row]: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
      setResizingRow(null);
    };

    if (resizingColumn || resizingRow) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizingRow]);
  
  const handleColumnResizeStart = (col: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).closest('th');
    setResizingColumn({
      col,
      startX: e.clientX,
      startWidth: th?.offsetWidth || 120,
    });
  };

  const handleRowResizeStart = (row: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const tr = (e.target as HTMLElement).closest('tr');
    setResizingRow({
      row,
      startY: e.clientY,
      startHeight: tr?.offsetHeight || 40,
    });
  };

  // ========== Render Functions ==========
  
  const renderCell = (row: number, col: string) => {
    const cellId = cellKey(row, col);
    const isSelected = selectedRange.has(cellId);
    const isEditing = editingCell?.row === row && editingCell?.col === col;
    const value = data[row][col];
    const isStartCell = multiSelectStart?.row === row && multiSelectStart?.col === col;
    const isEndCell = multiSelectEnd?.row === row && multiSelectEnd?.col === col;

    return (
      <td
        key={cellId}
        data-row={row}
        data-col={col}
        className={`px-4 py-2 border-r border-b border-[#2D2D2D] text-[#E5E5E5] min-w-[120px] max-w-[300px] relative cursor-cell transition-colors ${
          isSelected 
            ? 'bg-blue-900/30 border-blue-500 border-2' 
            : 'hover:bg-[#1A1A1A]'
        } ${isStartCell ? 'ring-2 ring-blue-400' : ''}`}
        style={{ 
          width: columnWidths[col] ? `${columnWidths[col]}px` : 'auto',
          height: rowHeights[row] ? `${rowHeights[row]}px` : 'auto',
        }}
        onMouseDown={(e) => handleCellMouseDown(row, col, e)}
        onMouseEnter={() => {
          if (isDragging && dragStart) {
            setDragEnd({ row, col });
            updateRangeSelection({ row, col });
          }
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={handleEditInputChange}
            onKeyDown={handleEditKeyDown}
            onBlur={() => {
              if (editingCell) {
                const col = editingCell.col as keyof SpreadsheetRow;
                onUpdateData(editingCell.row, col, editValue);
                setEditingCell(null);
              }
            }}
            className="w-full px-2 py-1 bg-[#1E1E1E] border border-blue-500 rounded outline-none text-white"
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
    <div className="h-full flex flex-col bg-[#0D0D0D]">
      {/* Statistics Bar */}
      <div className="flex-shrink-0 border-b border-[#2D2D2D] bg-[#252526] px-4 py-3">
        <div className="grid grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-[#9CA3AF]">📊 Rows:</span>
            <span className="ml-2 font-semibold text-white">{statistics.totalRows}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF]">💰 Sales:</span>
            <span className="ml-2 font-semibold text-white">${statistics.totalSales.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF]">💸 Cost:</span>
            <span className="ml-2 font-semibold text-white">${statistics.totalCost.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF]">📈 Profit:</span>
            <span className="ml-2 font-semibold text-white">${statistics.totalProfit.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[#9CA3AF]">🎯 Selected:</span>
            <span className="ml-2 font-semibold text-blue-500">{selectedRange.size}</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="flex-1 overflow-auto scrollbar-custom">
        <table
          ref={tableRef}
          className="w-full border-collapse text-sm bg-[#0D0D0D]"
        >
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-[#252526] border-b-2 border-[#2D2D2D]">
            <tr>
              <th className="w-12 px-2 py-2 text-center text-xs font-semibold text-[#9CA3AF] bg-[#252526] sticky left-0 z-20 border-r border-[#2D2D2D]">
                #
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  className="px-4 py-2 text-left font-semibold text-white border-r border-[#2D2D2D] min-w-[120px] bg-[#252526] sticky top-0 z-10 group relative"
                  style={{ width: columnWidths[col] ? `${columnWidths[col]}px` : 'auto' }}
                >
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    {sortState.column === col && (
                      <span className="ml-2 text-blue-500">
                        {sortState.order === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <div
                    className="absolute top-0 right-0 h-full w-2 cursor-col-resize group-hover:bg-blue-500/50"
                    onMouseDown={(e) => handleColumnResizeStart(col, e)}
                  />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-[#9CA3AF]">
                  📭 No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-[#2D2D2D] hover:bg-[#1A1A1A] transition-colors"
                >
                  {/* Row Number with Resizer */}
                  <td 
                    className="w-12 px-2 py-2 text-center text-xs font-semibold text-[#9CA3AF] bg-[#0D0D0D] border-r border-[#2D2D2D] sticky left-0 z-5 relative group"
                    style={{ height: rowHeights[rowIndex] ? `${rowHeights[rowIndex]}px` : 'auto' }}
                  >
                    {rowIndex + 1}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize group-hover:bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={(e) => handleRowResizeStart(rowIndex, e)}
                    />
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
        <div className="flex-shrink-0 border-t border-[#2D2D2D] bg-[#252526] px-4 py-2 text-xs text-[#9CA3AF] flex items-center justify-between">
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
          className="fixed bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-lg z-50 py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            onClick={() => { handleCopy(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-[#333333] text-[#E5E5E5]"
          >
            📋 Copy
          </button>
          <button
            onClick={() => { handleCut(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-[#333333] text-[#E5E5E5]"
          >
            ✂️ Cut
          </button>
          <button
            onClick={() => { handlePaste(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-[#333333] text-[#E5E5E5]"
          >
            📝 Paste
          </button>
          <div className="border-t border-[#3B3B3B]"></div>
          <button
            onClick={() => { handleDelete(); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-xs hover:bg-red-900/20 text-red-400"
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

export const SpreadsheetView = React.memo(SpreadsheetViewComponent);