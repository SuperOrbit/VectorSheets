import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpreadsheetView } from './components/SpreadsheetView';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { CommandPalette } from './components/CommandPalette';
import { Sidebar } from './components/Sidebar';
import { FontSelector } from './components/FontSelector';
import { ContextMenu } from './components/ContextMenu';
import { StatusBar } from './components/StatusBar';
import { NotificationToast } from './components/NotificationToast';
import { TrialBadge } from './components/TrialBadge';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { SheetTabs } from './components/SheetTabs';
import { Logo } from './components/Logo';
import type { ChatMessage, SpreadsheetRow, FunctionCallAction, HistoryEntry, FilterState, SortState, CellSelection, ChartData } from './types';
import { SPREADSHEET_DATA } from './constants';
import { getAIResponse } from './services/geminiService';

const MIN_SPREADSHEET_WIDTH = 500;
const MIN_PANEL_WIDTH = 320;

type FontFamily = 'inter' | 'system' | 'mono' | 'serif' | 'roboto' | 'opensans' | 'lato' | 'poppins' | 'sourcecodepro' | 'ibmplexsans';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI data analyst. I can help you analyze this sales data. Try asking me to 'show total sales by region' or 'sort by profit in descending order'.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sheetData, setSheetData] = useState<SpreadsheetRow[]>(SPREADSHEET_DATA);
  const [originalData] = useState<SpreadsheetRow[]>(SPREADSHEET_DATA);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // UI State - Load dark mode preference from localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('darkMode');
        return saved !== null ? saved === 'true' : true;
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return true;
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [panelWidth, setPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [activeView, setActiveView] = useState<'sheet' | 'chat' | 'split'>('split');
  const [fontFamily, setFontFamily] = useState<FontFamily>('inter');
  const [showFontSelector, setShowFontSelector] = useState(false);
  
  // Advanced Features
  const [filterState, setFilterState] = useState<FilterState>({ column: null, value: '' });
  const [sortState, setSortState] = useState<SortState>({ column: null, order: null });
  const [selectedCells, setSelectedCells] = useState<CellSelection | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [trialDaysRemaining] = useState(14);
  const [selectedCell, setSelectedCell] = useState('A1');
  const [sheets, setSheets] = useState(['Sheet1', 'Sheet2']);
  const [activeSheet, setActiveSheet] = useState('Sheet1');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Apply font family with all fonts
  useEffect(() => {
    const fontMap: Record<FontFamily, string> = {
      inter: '"Inter", system-ui, sans-serif',
      roboto: '"Roboto", system-ui, sans-serif',
      opensans: '"Open Sans", system-ui, sans-serif',
      lato: '"Lato", system-ui, sans-serif',
      poppins: '"Poppins", system-ui, sans-serif',
      ibmplexsans: '"IBM Plex Sans", system-ui, sans-serif',
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "SF Mono", Monaco, monospace',
      sourcecodepro: '"Source Code Pro", Monaco, monospace',
      serif: '"Georgia", "Times New Roman", serif',
    };
    document.documentElement.style.setProperty('--font-family', fontMap[fontFamily]);
  }, [fontFamily]);

  // Notification system
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // History management
  const addToHistory = (action: string, description: string) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      action,
      description,
    };
    setHistory(prev => [entry, ...prev].slice(0, 50));
    setHistoryIndex(-1);
  };

  // Undo/Redo functionality
  const undo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      showNotification('Undo successful', 'info');
    }
  }, [historyIndex, history.length]);

  const redo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      showNotification('Redo successful', 'info');
    }
  }, [historyIndex]);

  // Handle Toolbar Actions
  const handleToolbarAction = (action: string, params?: any) => {
    switch (action) {
      case 'undo':
        undo();
        break;
      case 'redo':
        redo();
        break;
      case 'print':
        window.print();
        showNotification('Print dialog opened');
        break;
      case 'bold':
      case 'italic':
      case 'underline':
        showNotification(`Applied ${action}`);
        break;
      default:
        break;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowSidebar(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', String(newMode));
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
        setSelectedCells(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSheetAction = useCallback((action: FunctionCallAction) => {
    switch (action.name) {
      case 'sort_data':
        const { column, order } = action.args;
        setSheetData(prevData => {
          const sortedData = [...prevData].sort((a, b) => {
            const valA = a[column!];
            const valB = b[column!];
            let comparison = 0;
            if (typeof valA === 'string' && typeof valB === 'string') {
              comparison = valA.localeCompare(valB);
            } else {
              comparison = valA > valB ? 1 : valA < valB ? -1 : 0;
            }
            return order === 'ascending' ? comparison : -comparison;
          });
          return sortedData;
        });
        setSortState({ column, order: order === 'ascending' ? 'asc' : 'desc' });
        addToHistory('sort', `Sorted by ${column} ${order}`);
        showNotification(`Sorted by ${column} ${order}`);
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorted by ${column} in ${order} order.` }]);
        break;

      case 'calculate_aggregate':
        const { column: calcCol, operation, filterColumn, filterValue } = action.args;
        setSheetData(currentData => {
          let data = currentData;
          if (filterColumn && filterValue) {
            data = currentData.filter(row =>
              String(row[filterColumn]).toLowerCase() === filterValue.toLowerCase()
            );
          }
          const values = data.map(row => row[calcCol!] as number).filter(v => typeof v === 'number');
          let result: number | string = 0;
          switch (operation) {
            case 'sum': result = values.reduce((a, b) => a + b, 0); break;
            case 'average': result = values.reduce((a, b) => a + b, 0) / values.length; break;
            case 'min': result = Math.min(...values); break;
            case 'max': result = Math.max(...values); break;
            case 'count': result = values.length; break;
          }
          const filterText = filterColumn ? ` (filtered by ${filterColumn}=${filterValue})` : '';
          addToHistory('calculate', `${operation} of ${calcCol}${filterText}`);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `${operation.toUpperCase()} of ${calcCol}${filterText}: ${typeof result === 'number' ? result.toLocaleString() : result}`
          }]);
          return currentData;
        });
        break;

      case 'filter_data':
        const { column: filterCol, value: filterVal } = action.args;
        setSheetData(prevData => {
          const filtered = prevData.filter(row =>
            String(row[filterCol!]).toLowerCase().includes(filterVal!.toLowerCase())
          );
          setFilterState({ column: filterCol, value: filterVal });
          addToHistory('filter', `Filtered ${filterCol} by "${filterVal}"`);
          showNotification(`Filtered: ${filtered.length} rows found`);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: `Filtered data: Found ${filtered.length} rows where ${filterCol} contains "${filterVal}".`
          }]);
          return filtered;
        });
        break;

      case 'add_row':
        const newRow: SpreadsheetRow = {
          month: action.args.month!,
          product: action.args.product!,
          region: action.args.region!,
          sales: action.args.sales!,
          cost: action.args.cost!,
          profit: action.args.profit!,
        };
        setSheetData(prev => [...prev, newRow]);
        addToHistory('add_row', `Added ${newRow.product}`);
        showNotification('Row added successfully');
        setMessages(prev => [...prev, { role: 'assistant', content: `Added new row: ${newRow.product} in ${newRow.region}` }]);
        break;

      case 'update_cell':
        const { rowIndex, column: updateCol, value: updateVal } = action.args;
        setSheetData(prevData => {
          const newData = [...prevData];
          const row = { ...newData[rowIndex!] };
          if (updateCol === 'sales' || updateCol === 'cost' || updateCol === 'profit') {
            row[updateCol] = Number(updateVal);
          } else {
            (row[updateCol!] as string) = updateVal!;
          }
          newData[rowIndex!] = row;
          addToHistory('update', `Updated row ${rowIndex! + 1}`);
          showNotification('Cell updated');
          setMessages(prev => [...prev, { role: 'assistant', content: `Updated row ${rowIndex! + 1}: ${updateCol} = ${updateVal}` }]);
          return newData;
        });
        break;

      case 'find_top_n':
        const { column: topCol, n } = action.args;
        setSheetData(currentData => {
          const sorted = [...currentData].sort((a, b) => (b[topCol!] as number) - (a[topCol!] as number));
          const topN = sorted.slice(0, n);
          const topList = topN.map((row, idx) =>
            `${idx + 1}. ${row.product} (${row.region}) - ${topCol}: ${(row[topCol!] as number).toLocaleString()}`
          ).join('\n');
          addToHistory('top_n', `Found top ${n} by ${topCol}`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Top ${n} by ${topCol}:\n\n${topList}` }]);
          return currentData;
        });
        break;

      case 'generate_chart':
        setChartData(action.args as ChartData);
        addToHistory('generate_chart', `Generated a ${action.args.chartType} chart`);
        showNotification('Chart generated successfully');
        setMessages(prev => [...prev, { role: 'assistant', content: `Generated a ${action.args.chartType} chart titled "${action.args.title}".` }]);
        break;

      case 'delete_rows':
        setSheetData(prevData => {
          const newData = prevData.filter((_, index) => !action.args.rowIndices.includes(index));
          addToHistory('delete_rows', `Deleted ${action.args.rowIndices.length} rows`);
          showNotification(`${action.args.rowIndices.length} rows deleted`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Deleted ${action.args.rowIndices.length} rows.` }]);
          return newData;
        });
        break;

      case 'delete_columns':
        setSheetData(prevData => {
          const newData = prevData.map(row => {
            const newRow = { ...row };
            action.args.columnNames.forEach(colName => {
              delete (newRow as any)[colName];
            });
            return newRow;
          });
          addToHistory('delete_columns', `Deleted columns: ${action.args.columnNames.join(', ')}`);
          showNotification(`Deleted columns: ${action.args.columnNames.join(', ')}`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Deleted columns: ${action.args.columnNames.join(', ')}.` }]);
          return newData;
        });
        break;

      case 'clear_filter':
        setFilterState({ column: null, value: '' });
        addToHistory('clear_filter', 'Cleared all filters');
        showNotification('Filters cleared');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Cleared all filters.' }]);
        break;

      case 'add_column':
        setSheetData(prevData => {
          const newData = prevData.map(row => ({
            ...row,
            [action.args.columnName]: action.args.defaultValue || '',
          }));
          addToHistory('add_column', `Added column: ${action.args.columnName}`);
          showNotification(`Added column: ${action.args.columnName}`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Added column: ${action.args.columnName}.` }]);
          return newData;
        });
        break;

      case 'batch_update':
        setSheetData(prevData => {
          const newData = [...prevData];
          action.args.updates.forEach(update => {
            if (newData[update.rowIndex]) {
              newData[update.rowIndex] = {
                ...newData[update.rowIndex],
                [update.column]: update.value,
              };
            }
          });
          addToHistory('batch_update', `Updated ${action.args.updates.length} cells`);
          showNotification(`Updated ${action.args.updates.length} cells`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Updated ${action.args.updates.length} cells.` }]);
          return newData;
        });
        break;

      case 'rename_sheet':
        setSheets(prevSheets => {
          const newSheets = [...prevSheets];
          const activeSheetIndex = newSheets.indexOf(activeSheet);
          if (activeSheetIndex !== -1) {
            newSheets[activeSheetIndex] = action.args.newName;
            setActiveSheet(action.args.newName);
            addToHistory('rename_sheet', `Renamed sheet to ${action.args.newName}`);
            showNotification(`Renamed sheet to ${action.args.newName}`);
            setMessages(prev => [...prev, { role: 'assistant', content: `Renamed sheet to ${action.args.newName}.` }]);
          }
          return newSheets;
        });
        break;

      case 'duplicate_sheet':
        setSheets(prevSheets => {
          const newSheets = [...prevSheets, action.args.newName];
          setActiveSheet(action.args.newName);
          addToHistory('duplicate_sheet', `Duplicated sheet to ${action.args.newName}`);
          showNotification(`Duplicated sheet to ${action.args.newName}`);
          setMessages(prev => [...prev, { role: 'assistant', content: `Duplicated sheet to ${action.args.newName}.` }]);
          return newSheets;
        });
        break;

      case 'pivot_table':
        // For now, just log the pivot table data to the console
        console.log('Pivot table data:', action.args);
        addToHistory('pivot_table', 'Generated a pivot table');
        showNotification('Pivot table generated');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Generated a pivot table.' }]);
        break;

      case 'create_chart':
        // For now, just log the chart data to the console
        console.log('Chart data:', action.args);
        addToHistory('create_chart', 'Generated a chart');
        showNotification('Chart generated');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Generated a chart.' }]);
        break;

      case 'format_cells':
        // For now, just log the format data to the console
        console.log('Format data:', action.args);
        addToHistory('format_cells', 'Formatted cells');
        showNotification('Cells formatted');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Formatted cells.' }]);
        break;

      case 'merge_cells':
        // For now, just log the merge data to the console
        console.log('Merge data:', action.args);
        addToHistory('merge_cells', 'Merged cells');
        showNotification('Cells merged');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Merged cells.' }]);
        break;

      case 'apply_formula':
        // For now, just log the formula data to the console
        console.log('Formula data:', action.args);
        addToHistory('apply_formula', 'Applied a formula');
        showNotification('Formula applied');
        setMessages(prev => [...prev, { role: 'assistant', content: 'Applied a formula.' }]);
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }, []);

  const handleSendMessage = async (userInput: string) => {
    if (!userInput.trim()) return;

    setChartData(null);

    if (userInput.toLowerCase().trim() === 'reset') {
      setSheetData(originalData);
      setFilterState({ column: null, value: '' });
      setSortState({ column: null, order: null });
      addToHistory('reset', 'Reset data to original');
      showNotification('Data reset successfully');
      setMessages(prev => [...prev,
        { role: 'user', content: userInput },
        { role: 'assistant', content: 'Data reset to original state.' }
      ]);
      return;
    }

    const newMessages: ChatMessage[] = [...messages, { role: 'user' as const, content: userInput }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(userInput, sheetData);
      const updatedMessages: ChatMessage[] = [...newMessages, { role: 'assistant' as const, content: aiResponse.text }];
      setMessages(updatedMessages);
      if (aiResponse.action) {
        handleSheetAction(aiResponse.action);
      }
    } catch (error) {
      console.error("Error getting AI response:", error);
      showNotification('Failed to get AI response', 'error');
      setMessages([...newMessages, { role: 'assistant' as const, content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSheetUpdate = useCallback((rowIndex: number, columnId: keyof SpreadsheetRow, value: string) => {
    setSheetData(prevData => {
      const newData = [...prevData];
      const rowToUpdate = { ...newData[rowIndex] };
      if (columnId === 'sales' || columnId === 'cost' || columnId === 'profit') {
        rowToUpdate[columnId] = Number(value.replace(/,/g, '')) || 0;
      } else {
        (rowToUpdate[columnId] as string) = value;
      }
      newData[rowIndex] = rowToUpdate;
      addToHistory('edit', `Edited ${columnId} in row ${rowIndex + 1}`);
      return newData;
    });
  }, []);

  const handleExport = () => {
    const csv = [
      Object.keys(sheetData[0]).join(','),
      ...sheetData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VectorSheet-${activeSheet}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    addToHistory('export', 'Exported data as CSV');
    showNotification('Data exported successfully');
  };

  const handleAddSheet = () => {
    const newSheetName = `Sheet${sheets.length + 1}`;
    setSheets([...sheets, newSheetName]);
    setActiveSheet(newSheetName);
    addToHistory('add_sheet', `Added new sheet: ${newSheetName}`);
    showNotification(`Sheet "${newSheetName}" created`);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const isResizingRef = useRef(isResizing);
  useEffect(() => { isResizingRef.current = isResizing; }, [isResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current || !mainContainerRef.current) return;
    const totalWidth = mainContainerRef.current.offsetWidth;
    const newPanelWidth = totalWidth - e.clientX;
    if (newPanelWidth >= MIN_PANEL_WIDTH && e.clientX >= MIN_SPREADSHEET_WIDTH) {
      setPanelWidth(newPanelWidth);
    }
  }, []);

  const handleMouseUp = useCallback(() => setIsResizing(false), []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleClearChart = () => {
    setChartData(null);
  };

  return (
    <div className={isDarkMode ? 'dark' : ''} style={{ fontFamily: 'var(--font-family)' }}>
      <main 
        ref={mainContainerRef} 
        className="bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-gray-100 h-screen w-full flex flex-col overflow-hidden"
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {/* Top Bar */}
        <div className="flex-shrink-0 h-12 border-b border-gray-200 dark:border-[#2d2d2d] bg-white dark:bg-[#252526] flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(prev => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors"
              title="Toggle Sidebar (⌘B)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo and Title - Space Grotesk Font */}
            <div className="flex items-center gap-2.5 group cursor-pointer hover:opacity-80 transition-opacity">
              <Logo size={28} isDarkMode={isDarkMode} />
              <div>
                <h1 
                  style={{ fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
                  className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-tight"
                >
                  VectorSheet
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5 font-medium">
                  AI Spreadsheet
                </p>
              </div>
            </div>

            <div className="flex items-center gap-px ml-4 bg-gray-100 dark:bg-[#2d2d2d] rounded">
              {(['sheet', 'split', 'chat'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    activeView === view
                      ? 'bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {view.charAt(0).toUpperCase() + view.slice(1)}
                </button>
              ))}
            </div>

            {/* Trial Badge */}
            <div className="ml-4">
              <TrialBadge daysRemaining={trialDaysRemaining} />
            </div>

            {/* Search Bar */}
            <div className="ml-4 relative">
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search... (⌘F)"
                className="w-64 px-3 py-1 text-xs bg-gray-100 dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30"
              title="Undo (⌘Z)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex <= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors disabled:opacity-30"
              title="Redo (⌘⇧Z)"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

            {/* History */}
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors"
              title="History"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Export */}
            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors"
              title="Export CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>

            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

            {/* Font Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFontSelector(prev => !prev)}
                className="px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                Aa
              </button>
              {showFontSelector && (
                <FontSelector
                  currentFont={fontFamily}
                  onSelectFont={setFontFamily}
                  onClose={() => setShowFontSelector(false)}
                />
              )}
            </div>

            <button
              onClick={() => setShowCommandPalette(true)}
              className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#2d2d2d] hover:bg-gray-200 dark:hover:bg-[#3d3d3d] rounded transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-400">⌘K</span>
            </button>

            <button
              onClick={() => {
                const newMode = !isDarkMode;
                setIsDarkMode(newMode);
                localStorage.setItem('darkMode', String(newMode));
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Toolbar - Google Sheets Style */}
        <Toolbar onAction={handleToolbarAction} isDarkMode={isDarkMode} />

        {/* Formula Bar */}
        <FormulaBar 
          selectedCell={selectedCell}
          cellValue=""
          onCellChange={(value) => {
            showNotification('Formula entered');
          }}
        />

        <div className="flex-1 flex overflow-hidden">
          {showSidebar && (
            <Sidebar 
              isDarkMode={isDarkMode}
              onReset={() => {
                setSheetData(originalData);
                setFilterState({ column: null, value: '' });
                setSortState({ column: null, order: null });
                addToHistory('reset', 'Reset data');
                showNotification('Data reset');
                setMessages(prev => [...prev, { role: 'assistant', content: 'Data reset.' }]);
              }}
              history={history}
              showHistory={showHistory}
              onCloseHistory={() => setShowHistory(false)}
            />
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {(activeView === 'sheet' || activeView === 'split') && (
                <div className={activeView === 'split' ? 'flex-1' : 'flex-1'}>
                  <SpreadsheetView 
                    data={sheetData} 
                    onUpdateData={handleSheetUpdate}
                    isDarkMode={isDarkMode}
                    filterState={filterState}
                    sortState={sortState}
                    searchQuery={searchQuery}
                    selectedCells={selectedCells}
                    onSelectCells={setSelectedCells}
                  />
                </div>
              )}

              {activeView === 'split' && (
                <div
                  onMouseDown={handleMouseDown}
                  className="flex-shrink-0 w-px bg-gray-200 dark:bg-[#2d2d2d] hover:bg-blue-500 cursor-col-resize transition-colors"
                />
              )}

              {(activeView === 'chat' || activeView === 'split') && (
                <div style={{ width: activeView === 'chat' ? '100%' : `${panelWidth}px` }}>
                  <AIAssistantPanel
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    chatContainerRef={chatContainerRef}
                    isDarkMode={isDarkMode}
                    chartData={chartData}
                    onClearChart={handleClearChart}
                  />
                </div>
              )}
            </div>

            {/* Sheet Tabs - Bottom */}
            <SheetTabs
              sheets={sheets}
              activeSheet={activeSheet}
              onSheetChange={setActiveSheet}
              onAddSheet={handleAddSheet}
            />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar 
          rowCount={sheetData.length}
          selectedCount={selectedCells ? 1 : 0}
          filterActive={filterState.column !== null}
          sortActive={sortState.column !== null}
        />

        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onCopy={() => {
              showNotification('Copied to clipboard');
              setContextMenu(null);
            }}
            onPaste={() => {
              showNotification('Pasted');
              setContextMenu(null);
            }}
            onDelete={() => {
              showNotification('Deleted');
              setContextMenu(null);
            }}
          />
        )}

        {notification && (
          <NotificationToast
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onCommand={(cmd) => {
              setShowCommandPalette(false);
              handleSendMessage(cmd);
            }}
            isDarkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  );
};

export default App;
