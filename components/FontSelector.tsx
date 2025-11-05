import React from 'react';

type FontFamily = 'inter' | 'system' | 'mono' | 'serif' | 'roboto' | 'opensans' | 'lato' | 'poppins' | 'sourcecodepro' | 'ibmplexsans';

interface FontSelectorProps {
  currentFont: FontFamily;
  onSelectFont: (font: FontFamily) => void;
  onClose: () => void;
}

export const FontSelector: React.FC<FontSelectorProps> = ({ currentFont, onSelectFont, onClose }) => {
  const fonts = [
    { 
      id: 'inter' as FontFamily, 
      name: 'Inter', 
      description: 'Modern geometric sans-serif', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'roboto' as FontFamily, 
      name: 'Roboto', 
      description: 'Google\'s signature typeface', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'opensans' as FontFamily, 
      name: 'Open Sans', 
      description: 'Humanist sans-serif', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'lato' as FontFamily, 
      name: 'Lato', 
      description: 'Semi-rounded sans-serif', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'poppins' as FontFamily, 
      name: 'Poppins', 
      description: 'Geometric sans-serif', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'ibmplexsans' as FontFamily, 
      name: 'IBM Plex Sans', 
      description: 'Corporate grotesque', 
      preview: 'Aa',
      category: 'Sans-serif'
    },
    { 
      id: 'system' as FontFamily, 
      name: 'System', 
      description: 'Native system font', 
      preview: 'Aa',
      category: 'System'
    },
    { 
      id: 'mono' as FontFamily, 
      name: 'JetBrains Mono', 
      description: 'Code-optimized monospace', 
      preview: 'Aa',
      category: 'Monospace'
    },
    { 
      id: 'sourcecodepro' as FontFamily, 
      name: 'Source Code Pro', 
      description: 'Adobe monospace', 
      preview: 'Aa',
      category: 'Monospace'
    },
    { 
      id: 'serif' as FontFamily, 
      name: 'Georgia', 
      description: 'Classic serif typeface', 
      preview: 'Aa',
      category: 'Serif'
    },
  ];

  const groupedFonts = fonts.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {} as Record<string, typeof fonts>);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#252526] border border-gray-200 dark:border-[#2d2d2d] rounded-lg shadow-xl z-50 overflow-hidden">
        <div className="p-3 border-b border-gray-200 dark:border-[#2d2d2d]">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Font Family</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose your preferred typeface</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedFonts).map(([category, categoryFonts]) => (
            <div key={category} className="mb-4">
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {category}
              </div>
              {categoryFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => {
                    onSelectFont(font.id);
                    onClose();
                  }}
                  className={`w-full px-3 py-3 rounded text-left transition-all duration-200 ${
                    currentFont === font.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-[#2d2d2d] text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {font.name}
                        {currentFont === font.id && (
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{font.description}</div>
                    </div>
                    <div className={`text-3xl font-semibold ml-4 ${
                      currentFont === font.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                    }`} style={{ fontFamily: getFontFamily(font.id) }}>
                      {font.preview}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// Helper function to get actual font family string
const getFontFamily = (fontId: FontFamily): string => {
  const fontMap = {
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    opensans: '"Open Sans", sans-serif',
    lato: '"Lato", sans-serif',
    poppins: '"Poppins", sans-serif',
    ibmplexsans: '"IBM Plex Sans", sans-serif',
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", monospace',
    sourcecodepro: '"Source Code Pro", monospace',
    serif: '"Georgia", serif',
  };
  return fontMap[fontId];
};
