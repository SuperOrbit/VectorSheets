import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, ChartData, SpreadsheetRow, Suggestion, Collaborator } from '../types';
import Chart from './Chart';
import { Suggestions } from './assistant/Suggestions';
import { FeedbackControls } from './assistant/FeedbackControls';
import { ResponseCard } from './assistant/ResponseCard';
import { LoadingSpinner } from './assistant/LoadingSpinner';
import { ModelControls } from './assistant/ModelControls';
import { CollaboratorAvatars } from './assistant/CollaboratorAvatars';
import { generateSuggestions } from '../utils/suggestionGenerator';
import { exportAsMarkdown, exportAsText, exportAsHTML, exportAsJSON, exportCodeBlocks, downloadFile, copyToClipboard } from '../utils/exportUtils';

export type ModelMode = 'auto' | 'max' | 'gemini-pro' | 'gemini-flash';

interface AIAssistantPanelProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (message: string, modelMode?: ModelMode) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  isDarkMode: boolean;
  chartData: ChartData | null;
  onClearChart: () => void;
  onNewChat?: () => void;
  onShowHistory?: () => void;
  sheetData?: SpreadsheetRow[];
  collaborators?: Collaborator[];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
  onRegenerate?: (messageId: string) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  messages,
  isLoading,
  onSendMessage,
  chatContainerRef,
  isDarkMode,
  chartData,
  onClearChart,
  onNewChat,
  onShowHistory,
  sheetData = [],
  collaborators = [],
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onFeedback,
  onRegenerate,
}) => {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelMode>('auto');
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({});
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Generate contextual suggestions based on sheet data
  const suggestions = React.useMemo(() => {
    if (sheetData && sheetData.length > 0) {
      return generateSuggestions(sheetData);
    }
    return [
      { text: 'Analyze this data and provide insights', category: 'general' as const, icon: '💡' },
      { text: 'Show me total sales by region', category: 'analysis' as const, icon: '📊' },
      { text: 'Sort by profit in descending order', category: 'sort' as const, icon: '⬇️' },
    ];
  }, [sheetData]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestionText: string) => {
    setInput(suggestionText);
    textareaRef.current?.focus();
  };
  
  // Handle feedback
  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessageFeedback(prev => ({ ...prev, [messageId]: feedback }));
    if (onFeedback) {
      onFeedback(messageId, feedback);
    }
  };
  
  // Handle regenerate
  const handleRegenerate = (messageId: string) => {
    if (onRegenerate) {
      onRegenerate(messageId);
    }
  };
  
  // Get message ID (use index if no id)
  const getMessageId = (msg: ChatMessage, index: number): string => {
    return msg.id || `msg-${index}`;
  };

  // Export handlers
  const handleExport = async (format: 'markdown' | 'text' | 'html' | 'json' | 'code') => {
    setIsExportMenuOpen(false);
    
    let content: string;
    let filename: string;
    let mimeType: string;
    
    switch (format) {
      case 'markdown':
        content = exportAsMarkdown(messages, chartData);
        filename = `vectorsheet-ai-${new Date().toISOString().split('T')[0]}.md`;
        mimeType = 'text/markdown';
        break;
      case 'text':
        content = exportAsText(messages);
        filename = `vectorsheet-ai-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      case 'html':
        content = exportAsHTML(messages, chartData);
        filename = `vectorsheet-ai-${new Date().toISOString().split('T')[0]}.html`;
        mimeType = 'text/html';
        break;
      case 'json':
        content = exportAsJSON(messages, chartData);
        filename = `vectorsheet-ai-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
        break;
      case 'code':
        content = exportCodeBlocks(messages);
        filename = `vectorsheet-code-${new Date().toISOString().split('T')[0]}.txt`;
        mimeType = 'text/plain';
        break;
      default:
        return;
    }
    
    if (format === 'code' && content.trim() === '') {
      // Show notification if no code blocks found
      return;
    }
    
    downloadFile(content, filename, mimeType);
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExportMenuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+L or Cmd+L: Focus input
      if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // /: Trigger commands (could be used for command palette)
      if (e.key === '/' && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input, selectedModel);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };


  // Theme-aware classes
  const bgColor = isDarkMode ? 'bg-[#0D0D0D]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-[#9CA3AF]' : 'text-gray-600';
  const textPrimary = isDarkMode ? 'text-[#E5E5E5]' : 'text-gray-900';
  const bgSecondary = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50';
  const bgHover = isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100';

  const IconButton: React.FC<{
    icon: React.ReactNode;
    onClick?: () => void;
    title?: string;
    className?: string;
    'aria-label'?: string;
  }> = ({ icon, onClick, title, className = '', 'aria-label': ariaLabel }) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      className={`p-1.5 ${bgHover} rounded transition-all duration-200 ${textColor} hover:text-white ${className} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
    >
      {icon}
    </button>
  );

  return (
    <div className={`h-full flex flex-col ${bgColor} border-l ${borderColor} shadow-lg`}>
      {/* Header */}
      <div className={`flex-shrink-0 px-4 py-3 border-b ${borderColor} flex items-center justify-between ${bgColor}`}>
        <div className={`text-sm font-medium ${textColor}`} style={{ fontSize: '14px', fontWeight: 500 }}>
          AI Assistant
        </div>
        <div className="flex items-center gap-2">
          {/* Active Model Display */}
          <div className="flex items-center gap-2">
            <ModelControls
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              isDarkMode={isDarkMode}
            />
          </div>
          <div className="flex items-center gap-0.5">
            <IconButton
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              }
              title="New Chat"
              aria-label="Start new chat"
              onClick={() => {
                setInput('');
                if (onNewChat) {
                  onNewChat();
                }
              }}
            />
            <IconButton
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="History"
              aria-label="View chat history"
              onClick={() => {
                setIsChatHistoryOpen(!isChatHistoryOpen);
                if (onShowHistory) {
                  onShowHistory();
                }
              }}
            />
            <IconButton
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
              title="Copy"
              aria-label="Copy chat to clipboard"
              onClick={async () => {
                const text = messages.map(msg => `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`).join('\n\n');
                const success = await copyToClipboard(text);
                if (success) {
                  // Could show notification here
                }
              }}
            />
            {/* Export Menu */}
            <div className="relative" ref={exportMenuRef}>
              <IconButton
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                }
                title="Export"
                aria-label="Export conversation"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              />
              {isExportMenuOpen && (
                <div className={`absolute right-0 top-full mt-1 w-48 ${isDarkMode ? 'bg-[#2A2A2A] border-[#3B3B3B]' : 'bg-white border-gray-200'} border rounded-lg shadow-xl z-50 overflow-hidden animate-fadeIn`}>
                  <button
                    onClick={() => handleExport('markdown')}
                    className={`w-full px-4 py-2 text-left text-sm ${isDarkMode ? 'text-[#E5E5E5] hover:bg-[#333333]' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    📄 Export as Markdown
                  </button>
                  <button
                    onClick={() => handleExport('text')}
                    className={`w-full px-4 py-2 text-left text-sm ${isDarkMode ? 'text-[#E5E5E5] hover:bg-[#333333]' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    📝 Export as Text
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className={`w-full px-4 py-2 text-left text-sm ${isDarkMode ? 'text-[#E5E5E5] hover:bg-[#333333]' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    🌐 Export as HTML
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className={`w-full px-4 py-2 text-left text-sm ${isDarkMode ? 'text-[#E5E5E5] hover:bg-[#333333]' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    📊 Export as JSON
                  </button>
                  <div className={`border-t ${isDarkMode ? 'border-[#3B3B3B]' : 'border-gray-200'}`}></div>
                  <button
                    onClick={() => handleExport('code')}
                    className={`w-full px-4 py-2 text-left text-sm ${isDarkMode ? 'text-[#E5E5E5] hover:bg-[#333333]' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
                  >
                    💻 Export Code Blocks
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collaborator Avatars */}
      {collaborators && collaborators.length > 0 && (
        <CollaboratorAvatars collaborators={collaborators} isDarkMode={isDarkMode} />
      )}

      {/* Onboarding Suggestions */}
      {messages.length === 0 && suggestions.length > 0 && (
        <Suggestions
          suggestions={suggestions}
          onSuggestionClick={handleSuggestionClick}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Chart Display */}
      {chartData && (
        <div className={`flex-shrink-0 p-4 border-b ${borderColor} max-h-96 overflow-y-auto animate-fadeIn`}>
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs font-medium ${textColor}`}>Chart Preview</span>
            <button
              onClick={onClearChart}
              className={`px-2 py-1 text-xs ${textColor} hover:text-white ${bgHover} rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500`}
              aria-label="Close chart"
            >
              ✕ Close
            </button>
          </div>
          <Chart {...chartData} onSave={(dataUrl) => {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = chartData?.title ? `${chartData.title}.png` : 'chart.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }} isDarkMode={isDarkMode} />
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className={`flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin ${isDarkMode ? 'scrollbar-thumb-gray-700' : 'scrollbar-thumb-gray-300'}`}
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className={`text-center ${textColor} text-sm mt-8 animate-fadeIn`}>
            <p className="mb-2">Start a conversation to analyze your data</p>
            <p className="text-xs">Try: "Show me total sales by region"</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const messageId = getMessageId(msg, index);
          const feedback = messageFeedback[messageId] || msg.feedback || null;
          
          return (
            <div
              key={messageId}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              role="article"
              aria-label={msg.role === 'user' ? 'Your message' : 'Assistant response'}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm transition-all duration-200 ${
                  msg.role === 'user'
                    ? isDarkMode ? 'bg-[#3B3B3B] text-white' : 'bg-blue-500 text-white'
                    : `${bgSecondary} ${textPrimary} border ${borderColor}`
                }`}
              >
                {msg.role === 'assistant' ? (
                  <>
                    <ResponseCard content={msg.content} isDarkMode={isDarkMode} />
                    <FeedbackControls
                      onThumbsUp={() => handleFeedback(messageId, 'positive')}
                      onThumbsDown={() => handleFeedback(messageId, 'negative')}
                      onUndo={onUndo || (() => {})}
                      onRedo={onRedo || (() => {})}
                      onRegenerate={() => handleRegenerate(messageId)}
                      canUndo={canUndo}
                      canRedo={canRedo}
                      feedback={feedback}
                      isDarkMode={isDarkMode}
                    />
                  </>
                ) : (
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white' : textPrimary}`}>
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <LoadingSpinner
            showAfter={1000}
            message="Analyzing..."
            isDarkMode={isDarkMode}
          />
        )}
      </div>

      {/* Input Area */}
      <div className={`flex-shrink-0 border-t ${borderColor} p-4 ${bgColor} shadow-lg`}>
        <div className={`${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-gray-50'} rounded-lg border ${borderColor} p-3 focus-within:border-blue-500 focus-within:shadow-md transition-all duration-200`}>
          {/* Top Row Controls */}
          <div className="flex items-center gap-2 mb-2">
            <button
              className={`px-2.5 py-1 text-xs ${isDarkMode ? 'bg-[#2A2A2A] hover:bg-[#333333]' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} hover:text-white rounded-md transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              title="Mention sheets or cells"
              aria-label="Mention sheets or cells"
            >
              <span className="text-sm font-medium">@</span>
            </button>
            <div className={`px-2.5 py-1 text-xs ${isDarkMode ? 'bg-[#2A2A2A]' : 'bg-gray-200'} ${textColor} rounded-md flex items-center gap-1.5`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>1 Tab</span>
            </div>
            <button
              className={`px-2.5 py-1 text-xs ${isDarkMode ? 'bg-[#2A2A2A] hover:bg-[#333333]' : 'bg-gray-200 hover:bg-gray-300'} ${textColor} hover:text-white rounded-md transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              title="Add browser/data source"
              aria-label="Add browser or data source"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ Browser</span>
            </button>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Plan, @ for context, / for commands"
            rows={1}
            className={`w-full px-0 py-2 bg-transparent border-0 resize-none focus:outline-none text-sm ${textPrimary} ${isDarkMode ? 'placeholder:text-[#6B7280]' : 'placeholder:text-gray-400'} disabled:opacity-50 leading-relaxed`}
            style={{ minHeight: '24px', maxHeight: '200px' }}
            aria-label="Chat input"
            aria-describedby="input-help"
          />
          <div id="input-help" className="sr-only">Type your message and press Ctrl+Enter to send</div>

          {/* Bottom Row Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsContinuousMode(!isContinuousMode)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors flex items-center gap-1.5 border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isContinuousMode
                    ? isDarkMode ? 'bg-[#2A2A2A] border-[#3B3B3B] text-white' : 'bg-blue-100 border-blue-300 text-blue-700'
                    : `bg-transparent ${borderColor} ${textColor} hover:text-white hover:border-blue-500`
                }`}
                title="Continuous mode (Ctrl+↓)"
                aria-label="Toggle continuous mode"
                aria-pressed={isContinuousMode}
              >
                <span className="text-sm">∞</span>
                <span className={`text-[10px] ${isDarkMode ? 'text-[#6B7280]' : 'text-gray-400'}`}>Ctrl ↓</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className={`p-1.5 ${bgHover} rounded transition-colors ${textColor} hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                title="Attach image"
                aria-label="Attach image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-2 ${isDarkMode ? 'bg-[#3B3B3B] hover:bg-[#4A4A4A] disabled:bg-[#2A2A2A]' : 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300'} disabled:opacity-50 text-white rounded-full transition-all duration-200 disabled:cursor-not-allowed hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                title="Send (Ctrl+Enter)"
                aria-label="Send message"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${input.trim() ? 'rotate-0' : 'rotate-180'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
