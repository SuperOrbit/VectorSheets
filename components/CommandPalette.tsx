import React, { useState, useEffect, useRef } from 'react';

interface CommandPaletteProps {
  onClose: () => void;
  onCommand: (command: string) => void;
  isDarkMode: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onClose, onCommand, isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { label: 'Calculate total sales', command: 'calculate total sales' },
    { label: 'Calculate average profit', command: 'calculate average profit' },
    { label: 'Show top 5 products', command: 'show top 5 products by sales' },
    { label: 'Filter by North region', command: 'filter data by North region' },
    { label: 'Sort by sales ascending', command: 'sort by sales ascending' },
    { label: 'Sort by profit descending', command: 'sort by profit descending' },
    { label: 'Reset data', command: 'reset' },
  ];

  const filteredCommands = query
    ? commands.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        onCommand(filteredCommands[selectedIndex].command);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, filteredCommands, onClose, onCommand]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-lg w-full max-w-xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-gray-200 dark:border-[#2d2d2d] p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Type a command..."
            className="w-full bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {filteredCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => onCommand(cmd.command)}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2d2d2d]'
              }`}
            >
              {cmd.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
