import React, { useState, useEffect } from 'react';
import { analyticsService, type PromptAnalytics, type ExportAnalytics, type ErrorAnalytics, type UserActivity } from '../services/analyticsService';

interface DashboardProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ isDarkMode, onClose }) => {
  const [promptAnalytics, setPromptAnalytics] = useState<PromptAnalytics[]>([]);
  const [exportAnalytics, setExportAnalytics] = useState<ExportAnalytics[]>([]);
  const [errorAnalytics, setErrorAnalytics] = useState<ErrorAnalytics[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadAnalytics();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadAnalytics();
      setRefreshKey(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = () => {
    setPromptAnalytics(analyticsService.getPromptAnalytics());
    setExportAnalytics(analyticsService.getExportAnalytics());
    setErrorAnalytics(analyticsService.getErrorAnalytics());
    setUserActivity(analyticsService.getUserActivity());
    setActiveUsers(analyticsService.getActiveUsersCount());
  };

  const bgColor = isDarkMode ? 'bg-[#0D0D0D]' : 'bg-white';
  const borderColor = isDarkMode ? 'border-[#2D2D2D]' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-[#9CA3AF]' : 'text-gray-600';
  const textPrimary = isDarkMode ? 'text-[#E5E5E5]' : 'text-gray-900';
  const bgCard = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className={`${bgColor} ${borderColor} border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex-shrink-0 px-6 py-4 border-b ${borderColor} flex items-center justify-between`}>
          <h2 className={`text-xl font-bold ${textPrimary}`}>Analytics Dashboard</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalytics}
              className={`px-3 py-1.5 text-sm ${isDarkMode ? 'bg-[#2A2A2A] hover:bg-[#333333]' : 'bg-gray-100 hover:bg-gray-200'} ${textColor} rounded transition-colors`}
            >
              🔄 Refresh
            </button>
            <button
              onClick={onClose}
              className={`p-2 ${isDarkMode ? 'hover:bg-[#2A2A2A]' : 'hover:bg-gray-100'} rounded transition-colors`}
              aria-label="Close dashboard"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`${bgCard} ${borderColor} border rounded-lg p-4`}>
              <div className={`text-sm ${textColor} mb-1`}>Active Users (24h)</div>
              <div className={`text-2xl font-bold ${textPrimary}`}>{activeUsers}</div>
            </div>
            <div className={`${bgCard} ${borderColor} border rounded-lg p-4`}>
              <div className={`text-sm ${textColor} mb-1`}>Total Prompts</div>
              <div className={`text-2xl font-bold ${textPrimary}`}>{userActivity?.promptsCount || 0}</div>
            </div>
            <div className={`${bgCard} ${borderColor} border rounded-lg p-4`}>
              <div className={`text-sm ${textColor} mb-1`}>Total Exports</div>
              <div className={`text-2xl font-bold ${textPrimary}`}>{userActivity?.exportsCount || 0}</div>
            </div>
            <div className={`${bgCard} ${borderColor} border rounded-lg p-4`}>
              <div className={`text-sm ${textColor} mb-1`}>Errors</div>
              <div className={`text-2xl font-bold ${textPrimary}`}>{userActivity?.errorsCount || 0}</div>
            </div>
          </div>

          {/* Prompt Popularity */}
          <div className={`${bgCard} ${borderColor} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Most Popular Prompts</h3>
            <div className="space-y-3">
              {promptAnalytics.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${textPrimary} truncate`}>{item.prompt}</div>
                    <div className={`text-xs ${textColor} mt-1`}>
                      {item.category} • {item.count} uses • {Math.round(item.successRate * 100)}% success
                    </div>
                  </div>
                  <div className={`text-xs ${textColor} ml-4`}>
                    {item.avgResponseTime ? `${Math.round(item.avgResponseTime)}ms` : '-'}
                  </div>
                </div>
              ))}
              {promptAnalytics.length === 0 && (
                <div className={`text-sm ${textColor} text-center py-4`}>No prompt data yet</div>
              )}
            </div>
          </div>

          {/* Export Usage */}
          <div className={`${bgCard} ${borderColor} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Export Usage</h3>
            <div className="space-y-3">
              {exportAnalytics.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className={`text-sm ${textPrimary} capitalize`}>{item.format.replace('_', ' ')}</div>
                  <div className={`text-sm ${textColor}`}>{item.count} exports</div>
                </div>
              ))}
              {exportAnalytics.length === 0 && (
                <div className={`text-sm ${textColor} text-center py-4`}>No export data yet</div>
              )}
            </div>
          </div>

          {/* Error Rates */}
          <div className={`${bgCard} ${borderColor} border rounded-lg p-6`}>
            <h3 className={`text-lg font-semibold ${textPrimary} mb-4`}>Error Analytics</h3>
            <div className="space-y-3">
              {errorAnalytics.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`text-sm ${textPrimary}`}>{item.errorType}</div>
                    <div className={`text-xs ${textColor} mt-1`}>
                      {item.canRetry ? 'Retriable' : 'Non-retriable'}
                    </div>
                  </div>
                  <div className={`text-sm ${textColor} ml-4`}>{item.count} occurrences</div>
                </div>
              ))}
              {errorAnalytics.length === 0 && (
                <div className={`text-sm ${textColor} text-center py-4`}>No errors recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

