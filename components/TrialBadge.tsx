import React, { useState } from 'react';

interface TrialBadgeProps {
  daysRemaining: number;
}

export const TrialBadge: React.FC<TrialBadgeProps> = ({ daysRemaining }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getProgressColor = () => {
    if (daysRemaining > 10) return 'from-green-500 to-emerald-600';
    if (daysRemaining > 5) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-pink-600';
  };

  const progressPercentage = (daysRemaining / 14) * 100;

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="group cursor-pointer"
      >
        {/* Badge with Pulse Animation */}
        <div className="relative">
          {/* Animated Pulse Ring */}
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
          
          {/* Badge Content */}
          <div className={`relative px-3 py-1 rounded-full bg-gradient-to-r ${getProgressColor()} shadow-lg flex items-center gap-2 animate-pulse-slow`}>
            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
            <span className="text-xs font-bold text-white uppercase tracking-wide">Trial</span>
          </div>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 animate-slideInUp">
            <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-xl p-4 w-64 border border-gray-700">
              {/* Arrow */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
              
              {/* Content */}
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold">Trial Version</h4>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs text-gray-400">Free</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">Time Remaining</span>
                    <span className="text-xs font-bold text-white">{daysRemaining} days</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-500 rounded-full`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">Unlimited AI queries</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">All premium features</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-300">Export & collaboration</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
