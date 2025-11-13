import React from 'react';

interface LoadingSpinnerProps {
  showAfter?: number; // Show spinner after this many milliseconds
  message?: string;
  isDarkMode: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  showAfter = 1000,
  message = 'Analyzing...',
  isDarkMode,
}) => {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, showAfter);

    return () => clearTimeout(timer);
  }, [showAfter]);

  if (!show) return null;

  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 border-2 border-[#3B3B3B] rounded-full"></div>
            <div className="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <span className="text-sm text-[#9CA3AF]">{message}</span>
        </div>
      </div>
    </div>
  );
};

