import React from 'react';

interface ResponseCardProps {
  content: string;
  isDarkMode: boolean;
}

export const ResponseCard: React.FC<ResponseCardProps> = ({ content, isDarkMode }) => {
  // Theme-aware classes
  const bgCard = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white';
  const borderCard = isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-[#E5E5E5]' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-[#D1D5DB]' : 'text-gray-600';
  const bgCode = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50';
  const borderCode = isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200';
  const bgStep = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-blue-50';
  const borderStep = isDarkMode ? 'border-blue-500' : 'border-blue-400';

  const renderFormattedContent = () => {
    // Split content into sections (code blocks, lists, etc.)
    const parts: Array<{ type: 'text' | 'code' | 'list' | 'heading'; content: string; lang?: string }> = [];
    let remaining = content;

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const codeBlocks: Array<{ start: number; end: number; lang: string; code: string }> = [];

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        lang: match[1] || '',
        code: match[2],
      });
    }

    // Process content with code blocks
    let currentIndex = 0;
    codeBlocks.forEach((block) => {
      if (currentIndex < block.start) {
        const textBefore = content.substring(currentIndex, block.start);
        if (textBefore.trim()) {
          parts.push({ type: 'text', content: textBefore });
        }
      }
      parts.push({ type: 'code', content: block.code, lang: block.lang });
      currentIndex = block.end;
    });

    if (currentIndex < content.length) {
      const textAfter = content.substring(currentIndex);
      if (textAfter.trim()) {
        parts.push({ type: 'text', content: textAfter });
      }
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <pre
            key={index}
            className={`${bgCode} border ${borderCode} rounded-md p-3 my-2 overflow-x-auto text-xs font-mono ${textPrimary} shadow-sm`}
          >
            <code>{part.content}</code>
          </pre>
        );
      }

      // Process text for markdown-like formatting
      let formatted = part.content;
      
      // Headers
      const headerColor = isDarkMode ? 'text-white' : 'text-gray-900';
      formatted = formatted.replace(/^### (.*$)/gim, `<h3 class="text-base font-semibold ${headerColor} mt-3 mb-2">$1</h3>`);
      formatted = formatted.replace(/^## (.*$)/gim, `<h2 class="text-lg font-semibold ${headerColor} mt-4 mb-2">$1</h2>`);
      formatted = formatted.replace(/^# (.*$)/gim, `<h1 class="text-xl font-bold ${headerColor} mt-4 mb-3">$1</h1>`);
      
      // Bold and italic
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, `<strong class="font-semibold ${headerColor}">$1</strong>`);
      formatted = formatted.replace(/\*(.*?)\*/g, `<em class="italic ${textSecondary}">$1</em>`);
      formatted = formatted.replace(/__(.*?)__/g, '<u class="underline">$1</u>');
      
      // Inline code
      formatted = formatted.replace(/`([^`]+)`/g, `<code class="${bgCode} px-1.5 py-0.5 rounded text-xs font-mono ${textPrimary} border ${borderCode}">$1</code>`);
      
      // Lists
      const listItems = formatted.match(/^[-*] (.+)$/gm);
      if (listItems && listItems.length > 0) {
        const listHtml = listItems.map(item => {
          const text = item.replace(/^[-*] /, '');
          return `<li class="ml-4 mb-1 ${textPrimary}">${text}</li>`;
        }).join('');
        formatted = formatted.replace(/^[-*] (.+)$/gm, '');
        formatted = `<ul class="list-disc space-y-1 my-2">${listHtml}</ul>` + formatted;
      }
      
      // Numbered lists
      const numberedItems = formatted.match(/^\d+\. (.+)$/gm);
      if (numberedItems && numberedItems.length > 0) {
        const listHtml = numberedItems.map(item => {
          const text = item.replace(/^\d+\. /, '');
          return `<li class="ml-4 mb-1 ${textPrimary}">${text}</li>`;
        }).join('');
        formatted = formatted.replace(/^\d+\. (.+)$/gm, '');
        formatted = `<ol class="list-decimal space-y-1 my-2">${listHtml}</ol>` + formatted;
      }

      // Step-wise explanations (lines starting with "Step", "1.", etc.)
      formatted = formatted.replace(/^(Step \d+[:.]\s*.+)$/gim, `<div class="${bgStep} border-l-2 ${borderStep} pl-3 py-2 my-2 rounded-r ${textPrimary}">$1</div>`);

      return (
        <div
          key={index}
          className={`prose prose-sm max-w-none text-sm leading-relaxed whitespace-pre-wrap ${textPrimary}`}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  return (
    <div className={`${bgCard} ${textPrimary} border ${borderCard} rounded-lg px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200`}>
      {renderFormattedContent()}
    </div>
  );
};

