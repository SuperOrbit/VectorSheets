import React from 'react';
import type { Suggestion } from '../../types';

interface SuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: string) => void;
  isDarkMode: boolean;
}

export const Suggestions: React.FC<SuggestionsProps> = ({
  suggestions,
  onSuggestionClick,
  isDarkMode,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-[#2D2D2D] bg-[#0D0D0D]">
      <div className="text-xs font-medium text-[#9CA3AF] mb-2">Try asking me...</div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="px-3 py-1.5 text-xs bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2D2D2D] hover:border-[#3B3B3B] text-[#E5E5E5] rounded-md transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-sm hover:shadow-md"
            aria-label={`Use suggestion: ${suggestion.text}`}
            title={suggestion.text}
          >
            {suggestion.icon && <span>{suggestion.icon}</span>}
            <span className="truncate max-w-[200px]">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

