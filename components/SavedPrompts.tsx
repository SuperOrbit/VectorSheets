import React, { useState, useEffect } from 'react';
import { promptService, type SavedPrompt } from '../services/promptService';

interface SavedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  isDarkMode: boolean;
  onClose?: () => void;
}

export const SavedPrompts: React.FC<SavedPromptsProps> = ({ onSelectPrompt, isDarkMode, onClose }) => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPrompts();
  }, [showFavoritesOnly]);

  const loadPrompts = () => {
    setSavedPrompts(promptService.getSavedPrompts(showFavoritesOnly));
  };

  const filteredPrompts = savedPrompts.filter(p => 
    p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const bgColor = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-[#9CA3AF]' : 'text-gray-600';
  const textPrimary = isDarkMode ? 'text-[#E5E5E5]' : 'text-gray-900';
  const bgHover = isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-50';

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-semibold ${textPrimary}`}>Saved Prompts</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-2 py-1 text-xs rounded ${showFavoritesOnly ? 'bg-blue-500 text-white' : bgHover} ${textColor} transition-colors`}
          >
            ⭐ Favorites
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1 ${bgHover} rounded transition-colors`}
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search prompts..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full px-3 py-2 mb-3 text-sm ${isDarkMode ? 'bg-[#0D0D0D] border-[#2D2D2D] text-[#E5E5E5]' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
      />

      {/* Prompts List */}
      <div className="space-y-2">
        {filteredPrompts.length === 0 ? (
          <div className={`text-center py-4 ${textColor} text-sm`}>
            {showFavoritesOnly ? 'No favorite prompts yet' : 'No saved prompts yet'}
          </div>
        ) : (
          filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className={`${bgHover} ${borderColor} border rounded p-3 cursor-pointer transition-all`}
              onClick={() => {
                onSelectPrompt(prompt.prompt);
                promptService.recordUsage(prompt.id);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${textPrimary} mb-1`}>{prompt.prompt}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${textColor}`}>{prompt.category}</span>
                    {prompt.tags.length > 0 && (
                      <span className={`text-xs ${textColor}`}>
                        {prompt.tags.map(tag => `#${tag}`).join(' ')}
                      </span>
                    )}
                    <span className={`text-xs ${textColor}`}>{prompt.useCount} uses</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    promptService.toggleFavorite(prompt.id);
                    loadPrompts();
                  }}
                  className={`p-1 ${prompt.isFavorite ? 'text-yellow-500' : textColor} transition-colors`}
                  aria-label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg className="w-4 h-4" fill={prompt.isFavorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

