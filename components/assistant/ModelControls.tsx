import React, { useState, useRef, useEffect } from 'react';
import type { ModelMode } from '../../services/geminiService';

interface ModelControlsProps {
  selectedModel: ModelMode;
  onModelChange: (model: ModelMode) => void;
  isDarkMode: boolean;
}

const MODEL_INFO: Record<ModelMode, { name: string; description: string }> = {
  auto: {
    name: 'Auto',
    description: 'Automatically selects the best model based on query complexity. Uses Gemini Pro for complex analysis and Gemini Flash for simple queries.',
  },
  max: {
    name: 'MAX Mode',
    description: 'Maximum quality mode using Gemini Pro with extended context and higher token limits. Best for complex analysis and detailed reasoning.',
  },
  'gemini-pro': {
    name: 'Gemini Pro',
    description: 'High-quality model optimized for complex reasoning, analysis, and multi-step tasks. Slower but more accurate.',
  },
  'gemini-flash': {
    name: 'Gemini Flash',
    description: 'Fast and efficient model for quick responses and simple queries. Lower latency, ideal for real-time interactions.',
  },
};

export const ModelControls: React.FC<ModelControlsProps> = ({
  selectedModel,
  onModelChange,
  isDarkMode,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const getModelDisplayName = (model: ModelMode): string => {
    return MODEL_INFO[model].name;
  };

  const currentModelInfo = MODEL_INFO[selectedModel];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="px-2.5 py-1 text-xs bg-transparent border border-[#2D2D2D] hover:border-[#3B3B3B] text-[#9CA3AF] hover:text-white rounded-md transition-all duration-200 flex items-center gap-1.5 hover:shadow-sm"
        aria-label={`Current model: ${currentModelInfo.name}. Click to change model.`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>{getModelDisplayName(selectedModel)}</span>
        </span>
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isDropdownOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-64 bg-[#2A2A2A] border border-[#3B3B3B] rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn"
          role="menu"
          aria-label="Model selection menu"
        >
          <div className="p-2">
            {(Object.keys(MODEL_INFO) as ModelMode[]).map((model) => {
              const info = MODEL_INFO[model];
              const isSelected = selectedModel === model;
              return (
                <button
                  key={model}
                  onClick={() => {
                    onModelChange(model);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2.5 text-left text-sm text-[#E5E5E5] hover:bg-[#333333] rounded flex items-start gap-3 transition-colors group"
                  role="menuitem"
                  aria-label={`Select ${info.name} model`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-500/20' : 'border-[#4B5563] group-hover:border-[#6B7280]'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{info.name}</div>
                    <div className="text-xs text-[#9CA3AF] mt-0.5 leading-relaxed">{info.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tooltip on hover */}
      <div
        className="absolute bottom-full left-0 mb-1 px-2 py-1 text-xs bg-[#1A1A1A] border border-[#3B3B3B] rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 z-50 max-w-xs"
        role="tooltip"
      >
        {currentModelInfo.description}
      </div>
    </div>
  );
};

