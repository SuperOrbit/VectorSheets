import React, { useState, useRef, useEffect } from 'react';

interface ToolbarProps {
  onAction: (action: string, params?: any) => void;
  isDarkMode: boolean;
  onFormatChange?: (format: any) => void;
}

interface MenuItem {
  label: string;
  action: string;
  shortcut?: string;
  submenu?: MenuItem[];
  icon?: string;
}

interface MenuDivider {
  divider: true;
}

type MenuElement = MenuItem | MenuDivider;

export const Toolbar: React.FC<ToolbarProps> = ({ onAction, isDarkMode, onFormatChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeFormat, setActiveFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
  });
  const [textColor, setTextColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState('10');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [alignment, setAlignment] = useState('left');
  const [zoom, setZoom] = useState(100);
  const [showColorMenu, setShowColorMenu] = useState<'text' | 'fill' | null>(null);
  const [showBordersMenu, setShowBordersMenu] = useState(false);

  const fontSizes = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '32', '36', '44', '52'];
  const fonts = ['Inter', 'Roboto', 'Open Sans', 'Arial', 'Times New Roman', 'Courier New', 'Georgia'];
  const colors = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#FF6600', '#009900'];

  const menus: Record<string, MenuElement[]> = {
    File: [
      { label: 'New', action: 'new_file', shortcut: '⌘N' },
      { label: 'Open', action: 'open_file', shortcut: '⌘O' },
      { label: 'Save', action: 'save_file', shortcut: '⌘S' },
      { divider: true },
      { label: 'Import CSV', action: 'import_csv' },
      { label: 'Export as CSV', action: 'export_csv' },
      { label: 'Export as PDF', action: 'export_pdf' },
      { divider: true },
      { label: 'Print', action: 'print', shortcut: '⌘P' },
      { label: 'Share', action: 'share', shortcut: '⌘⇧F12' },
    ],
    Edit: [
      { label: 'Undo', action: 'undo', shortcut: '⌘Z' },
      { label: 'Redo', action: 'redo', shortcut: '⌘⇧Z' },
      { divider: true },
      { label: 'Cut', action: 'cut', shortcut: '⌘X' },
      { label: 'Copy', action: 'copy', shortcut: '⌘C' },
      { label: 'Paste', action: 'paste', shortcut: '⌘V' },
      { label: 'Paste special', action: 'paste_special', shortcut: '⌘⇧V' },
      { divider: true },
      { label: 'Find', action: 'find', shortcut: '⌘F' },
      { label: 'Replace', action: 'replace', shortcut: '⌘H' },
      { divider: true },
      { label: 'Delete rows', action: 'delete_rows' },
      { label: 'Delete columns', action: 'delete_columns' },
    ],
    Insert: [
      { label: 'Rows above', action: 'insert_rows_above' },
      { label: 'Rows below', action: 'insert_rows_below' },
      { divider: true },
      { label: 'Columns left', action: 'insert_cols_left' },
      { label: 'Columns right', action: 'insert_cols_right' },
      { divider: true },
      { label: 'Comment', action: 'insert_comment', shortcut: '⌘⌥M' },
      { label: 'Checkbox', action: 'insert_checkbox' },
      { label: 'Dropdown', action: 'insert_dropdown' },
      { divider: true },
      { label: 'Chart', action: 'insert_chart' },
      { label: 'Image', action: 'insert_image' },
      { label: 'Link', action: 'insert_link', shortcut: '⌘K' },
    ],
    Format: [
      { label: 'Number format', action: 'format_number' },
      { label: 'Clear formatting', action: 'clear_format', shortcut: '⌘' },
      { divider: true },
      { label: 'Bold', action: 'bold', shortcut: '⌘B' },
      { label: 'Italic', action: 'italic', shortcut: '⌘I' },
      { label: 'Underline', action: 'underline', shortcut: '⌘U' },
      { divider: true },
      { label: 'Text color', action: 'text_color' },
      { label: 'Fill color', action: 'fill_color' },
      { divider: true },
      { label: 'Borders', action: 'borders' },
      { label: 'Merge cells', action: 'merge_cells' },
      { divider: true },
      { label: 'Conditional formatting', action: 'conditional_format' },
    ],
    Data: [
      { label: 'Sort range', action: 'sort_range' },
      { label: 'Filter', action: 'filter' },
      { label: 'Create a filter', action: 'create_filter' },
      { divider: true },
      { label: 'Data validation', action: 'data_validation' },
      { divider: true },
      { label: 'Pivot table', action: 'pivot_table' },
      { label: 'Data studio', action: 'data_studio' },
    ],
    Tools: [
      { label: 'Spelling', action: 'spelling', shortcut: '⌘⇧X' },
      { label: 'Notification rules', action: 'notifications' },
      { label: 'Protection', action: 'protection' },
      { divider: true },
      { label: 'Version history', action: 'version_history' },
      { label: 'Script editor', action: 'script_editor' },
      { divider: true },
      { label: 'Settings', action: 'settings' },
    ],
    Help: [
      { label: 'Keyboard shortcuts', action: 'help_shortcuts', shortcut: '?' },
      { label: 'About VectorSheet', action: 'about' },
      { label: 'Support', action: 'support' },
      { label: 'Send feedback', action: 'feedback' },
    ],
  };

  const handleFormatToggle = (format: keyof typeof activeFormat) => {
    const newFormat = { ...activeFormat, [format]: !activeFormat[format] };
    setActiveFormat(newFormat);
    onFormatChange?.(newFormat);
    onAction('format_text', { format, enabled: newFormat[format] });
  };

  const handleColorChange = (type: 'text' | 'fill', color: string) => {
    if (type === 'text') {
      setTextColor(color);
    } else {
      setFillColor(color);
    }
    onAction('color_change', { type, color });
    setShowColorMenu(null);
  };

  const handleAlignmentChange = (align: string) => {
    setAlignment(align);
    onAction('alignment', { align });
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    onAction('zoom', { zoom: newZoom });
  };

  const handleMenuAction = (action: string) => {
    onAction(action);
    setActiveMenu(null);
  };

  return (
    <div className="border-b border-[#2D2D2D] bg-[#252526]">
      {!isExpanded ? (
        /* Collapsed State - Only Edit Button */
        <div className="flex items-center px-4 py-2 text-sm border-b border-[#2D2D2D]">
          <button
            className="px-3 py-1 hover:bg-[#2A2A2A] rounded transition-colors text-[#9CA3AF] hover:text-white text-xs font-medium"
            onClick={() => setIsExpanded(true)}
          >
            Edit
          </button>
        </div>
      ) : (
        <>
          {/* Main Menu Bar */}
          <div className="flex items-center px-4 py-2 text-sm border-b border-[#2D2D2D]">
            {Object.keys(menus).map((menuName) => (
              <div key={menuName} className="relative">
                <button
                  className="px-3 py-1 hover:bg-[#2A2A2A] rounded transition-colors text-[#9CA3AF] hover:text-white text-xs font-medium"
                  onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                >
                  {menuName}
                </button>

                {activeMenu === menuName && (
                  <div className="absolute top-full left-0 mt-0 w-48 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-xl z-50">
                    {menus[menuName].map((item, idx) => (
                      <div key={idx}>
                        {'divider' in item ? (
                          <div className="my-1 border-t border-[#3B3B3B]"></div>
                        ) : (
                          <button
                            onClick={() => handleMenuAction(item.action)}
                            className="w-full px-4 py-2 text-left text-xs flex items-center justify-between hover:bg-[#333333] text-[#E5E5E5] hover:text-white transition-colors"
                          >
                            <span>{item.label}</span>
                            {item.shortcut && (
                              <span className="text-[#6B7280] text-[10px]">{item.shortcut}</span>
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center px-4 py-2 gap-2 overflow-x-auto scrollbar-thin flex-wrap bg-[#252526]">
        {/* Undo/Redo/Print */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#2D2D2D]">
          <button
            onClick={() => handleMenuAction('undo')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Undo (⌘Z)"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={() => handleMenuAction('redo')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Redo (⌘⇧Z)"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          <button
            onClick={() => handleMenuAction('print')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Print (⌘P)"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <button onClick={() => handleZoomChange(Math.max(50, zoom - 10))} className="p-1 hover:bg-[#2A2A2A] rounded text-xs font-semibold text-[#9CA3AF] hover:text-white">−</button>
          <select 
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            className="px-2 py-1 text-xs bg-[#1E1E1E] border border-[#2D2D2D] rounded hover:bg-[#2A2A2A] outline-none cursor-pointer text-[#E5E5E5]"
          >
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
            <option value="125">125%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </select>
          <button onClick={() => handleZoomChange(Math.min(200, zoom + 10))} className="p-1 hover:bg-[#2A2A2A] rounded text-xs font-semibold text-[#9CA3AF] hover:text-white">+</button>
        </div>

        {/* Number Format */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <button 
            onClick={() => handleMenuAction('format_currency')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Format as currency ($)"
          >
            <span className="text-sm font-semibold text-[#9CA3AF] group-hover:text-white">$</span>
          </button>
          <button 
            onClick={() => handleMenuAction('format_percent')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Format as percent (%)"
          >
            <span className="text-sm font-semibold text-[#9CA3AF] group-hover:text-white">%</span>
          </button>
          <button 
            onClick={() => handleMenuAction('decrease_decimal')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Decrease decimal places"
          >
            <span className="text-sm font-semibold text-[#9CA3AF] group-hover:text-white">.0</span>
          </button>
          <button 
            onClick={() => handleMenuAction('increase_decimal')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Increase decimal places"
          >
            <span className="text-sm font-semibold text-[#9CA3AF] group-hover:text-white">.00</span>
          </button>
        </div>

        {/* Font Selection */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <select 
            value={fontFamily}
            onChange={(e) => {
              setFontFamily(e.target.value);
              onAction('font_change', { font: e.target.value });
            }}
            className="px-2 py-1 text-xs bg-[#1E1E1E] border border-[#2D2D2D] rounded hover:bg-[#2A2A2A] outline-none cursor-pointer min-w-[140px] text-[#E5E5E5]"
          >
            {fonts.map(font => (
              <option key={font} value={font} className="bg-[#2A2A2A]">{font}</option>
            ))}
          </select>
          
          <select 
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value);
              onAction('font_size_change', { size: Number(e.target.value) });
            }}
            className="px-2 py-1 text-xs bg-[#1E1E1E] border border-[#2D2D2D] rounded hover:bg-[#2A2A2A] outline-none cursor-pointer w-20 text-[#E5E5E5]"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <button
            onClick={() => handleFormatToggle('bold')}
            className={`p-2 rounded transition-colors group ${
              activeFormat.bold ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'
            }`}
            title="Bold (⌘B)"
          >
            <span className={`text-sm font-bold ${activeFormat.bold ? 'text-white' : 'text-[#9CA3AF]'}`}>B</span>
          </button>
          <button
            onClick={() => handleFormatToggle('italic')}
            className={`p-2 rounded transition-colors group ${
              activeFormat.italic ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'
            }`}
            title="Italic (⌘I)"
          >
            <span className={`text-sm italic ${activeFormat.italic ? 'text-white' : 'text-[#9CA3AF]'}`}>I</span>
          </button>
          <button
            onClick={() => handleFormatToggle('underline')}
            className={`p-2 rounded transition-colors group ${
              activeFormat.underline ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'
            }`}
            title="Underline (⌘U)"
          >
            <span className={`text-sm underline ${activeFormat.underline ? 'text-white' : 'text-[#9CA3AF]'}`}>U</span>
          </button>
          <button
            onClick={() => handleFormatToggle('strikethrough')}
            className={`p-2 rounded transition-colors group ${
              activeFormat.strikethrough ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'
            }`}
            title="Strikethrough"
          >
            <span className={`text-sm line-through ${activeFormat.strikethrough ? 'text-white' : 'text-[#9CA3AF]'}`}>S</span>
          </button>
          
          {/* Text Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorMenu(showColorMenu === 'text' ? null : 'text')}
              className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group flex items-center gap-1"
              title="Text color"
            >
              <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
              </svg>
              <div className="w-3 h-3 rounded-sm border border-[#3B3B3B]" style={{ backgroundColor: textColor }}></div>
            </button>
            {showColorMenu === 'text' && (
              <div className="absolute top-full left-0 mt-1 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-xl p-3 z-50">
                <div className="grid grid-cols-5 gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange('text', color)}
                      className="w-6 h-6 rounded border-2 border-[#3B3B3B] hover:border-white transition-all"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Fill Color */}
          <div className="relative">
            <button
              onClick={() => setShowColorMenu(showColorMenu === 'fill' ? null : 'fill')}
              className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group flex items-center gap-1"
              title="Fill color"
            >
              <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13a1 1 0 011-1h2a1 1 0 011 1v6a2 2 0 01-2 2H4a2 2 0 01-2-2v-6zM13 5a1 1 0 011-1h2a1 1 0 011 1v14a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM23 9a1 1 0 011-1h2a1 1 0 011 1v10a2 2 0 01-2 2h-2a2 2 0 01-2-2V9z" />
              </svg>
              <div className="w-3 h-3 rounded-sm border border-[#3B3B3B]" style={{ backgroundColor: fillColor }}></div>
            </button>
            {showColorMenu === 'fill' && (
              <div className="absolute top-full left-0 mt-1 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-xl p-3 z-50">
                <div className="grid grid-cols-5 gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => handleColorChange('fill', color)}
                      className="w-6 h-6 rounded border-2 border-[#3B3B3B] hover:border-white transition-all"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <button
            onClick={() => handleAlignmentChange('left')}
            className={`p-2 rounded transition-colors ${alignment === 'left' ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'}`}
            title="Align left"
          >
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => handleAlignmentChange('center')}
            className={`p-2 rounded transition-colors ${alignment === 'center' ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'}`}
            title="Align center"
          >
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          <button
            onClick={() => handleAlignmentChange('right')}
            className={`p-2 rounded transition-colors ${alignment === 'right' ? 'bg-[#3B3B3B]' : 'hover:bg-[#2A2A2A]'}`}
            title="Align right"
          >
            <svg className="w-4 h-4 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h10" />
            </svg>
          </button>
        </div>

        {/* Cell Tools */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <div className="relative">
            <button
              onClick={() => setShowBordersMenu(!showBordersMenu)}
              className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group flex items-center gap-1"
              title="Borders"
            >
              <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </button>
            {showBordersMenu && (
              <div className="absolute top-full left-0 mt-1 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-xl p-2 z-50">
                <div className="space-y-1">
                  <button onClick={() => { handleMenuAction('border_all'); setShowBordersMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#333333] rounded text-[#E5E5E5]">All borders</button>
                  <button onClick={() => { handleMenuAction('border_outline'); setShowBordersMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#333333] rounded text-[#E5E5E5]">Outline</button>
                  <button onClick={() => { handleMenuAction('border_none'); setShowBordersMenu(false); }} className="w-full px-3 py-2 text-left text-xs hover:bg-[#333333] rounded text-[#E5E5E5]">No borders</button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => handleMenuAction('merge_cells')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Merge cells"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
        </div>

        {/* Insert & Data Tools */}
        <div className="flex items-center gap-1 px-2 border-r border-[#2D2D2D]">
          <button
            onClick={() => handleMenuAction('insert_link')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Insert link (⌘K)"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
          <button
            onClick={() => handleMenuAction('insert_comment')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Insert comment"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          <button
            onClick={() => handleMenuAction('insert_chart')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Insert chart"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={() => handleMenuAction('filter_data')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Filter"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Functions & More */}
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => handleMenuAction('functions')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="Functions (⌘⇧F)"
          >
            <span className="text-xs font-bold text-[#9CA3AF] group-hover:text-white">ƒx</span>
          </button>
          <button
            onClick={() => handleMenuAction('more')}
            className="p-2 hover:bg-[#2A2A2A] rounded transition-colors group"
            title="More options"
          >
            <svg className="w-4 h-4 text-[#9CA3AF] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
};