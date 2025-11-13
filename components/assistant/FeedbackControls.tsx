import React from 'react';

interface FeedbackControlsProps {
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRegenerate: () => void;
  canUndo: boolean;
  canRedo: boolean;
  feedback?: 'positive' | 'negative' | null;
  isDarkMode: boolean;
}

export const FeedbackControls: React.FC<FeedbackControlsProps> = ({
  onThumbsUp,
  onThumbsDown,
  onUndo,
  onRedo,
  onRegenerate,
  canUndo,
  canRedo,
  feedback,
  isDarkMode,
}) => {
  const IconButton: React.FC<{
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    isActive?: boolean;
    disabled?: boolean;
    'aria-label': string;
  }> = ({ icon, onClick, title, isActive, disabled, 'aria-label': ariaLabel }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`p-1.5 rounded transition-all duration-200 ${
        isActive
          ? 'bg-[#3B3B3B] text-blue-400'
          : 'bg-transparent hover:bg-[#2A2A2A] text-[#6B7280] hover:text-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} active:scale-95`}
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#2D2D2D]">
      <IconButton
        icon={
          <svg
            className="w-3.5 h-3.5"
            fill={feedback === 'positive' ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
        }
        onClick={onThumbsUp}
        title="Helpful (Thumbs up)"
        isActive={feedback === 'positive'}
        aria-label="Mark as helpful"
      />
      <IconButton
        icon={
          <svg
            className="w-3.5 h-3.5"
            fill={feedback === 'negative' ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
            />
          </svg>
        }
        onClick={onThumbsDown}
        title="Not helpful (Thumbs down)"
        isActive={feedback === 'negative'}
        aria-label="Mark as not helpful"
      />
      <div className="w-px h-4 bg-[#2D2D2D] mx-1" />
      <IconButton
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        }
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        aria-label="Undo last action"
      />
      <IconButton
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        }
        onClick={onRedo}
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        aria-label="Redo last action"
      />
      <IconButton
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        }
        onClick={onRegenerate}
        title="Regenerate response"
        aria-label="Regenerate AI response"
      />
    </div>
  );
};

