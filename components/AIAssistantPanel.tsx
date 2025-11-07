import React, { useState } from 'react';
import type { ChatMessage, ChartData } from '../types';
import Chart from './Chart';

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
  chartData: ChartData | null;
  onClearChart: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  chatContainerRef,
  isDarkMode,
  chartData,
  onClearChart,
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleSaveChart = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = chartData?.title ? `${chartData.title}.png` : 'chart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Allow backspace to work normally - remove the prevention
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1e1e1e] border-l border-gray-200 dark:border-[#2d2d2d]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2d2d2d]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">VectorSheet</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your AI Data Analyst</p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Online</span>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      {chartData && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-[#2d2d2d] max-h-96 overflow-y-auto">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Chart Preview</span>
            <button 
              onClick={onClearChart}
              className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2d2d2d] rounded transition-colors"
            >
              ✕ Close
            </button>
          </div>
          <Chart {...chartData} onSave={handleSaveChart} isDarkMode={isDarkMode} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-[#252526] text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
              <div className={`text-xs mt-2 ${
                msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-[#252526] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-[#2d2d2d] p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="e.g., 'Sort by profit in descending order'"
            rows={1}
            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#252526] border border-gray-200 dark:border-[#2d2d2d] rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-50 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>
    </div>
  );
};
