import React from 'react';

interface LogoProps {
  size?: number;
  isDarkMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, isDarkMode = true }) => {
  const primaryColor = isDarkMode ? '#60a5fa' : '#2563eb';
  const secondaryColor = isDarkMode ? '#3b82f6' : '#1d4ed8';
  const accentColor = isDarkMode ? '#93c5fd' : '#1e40af';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300"
    >
      {/* Background Circle */}
      <circle
        cx="16"
        cy="16"
        r="15"
        fill={primaryColor}
        opacity="0.1"
      />

      {/* Main Shape - Spreadsheet Grid */}
      <g>
        {/* Top Row */}
        <rect x="6" y="6" width="4" height="4" fill={primaryColor} rx="0.5" />
        <rect x="11" y="6" width="4" height="4" fill={secondaryColor} rx="0.5" />
        <rect x="16" y="6" width="4" height="4" fill={accentColor} rx="0.5" />
        <rect x="21" y="6" width="4" height="4" fill={primaryColor} opacity="0.7" rx="0.5" />

        {/* Middle Row */}
        <rect x="6" y="11" width="4" height="4" fill={secondaryColor} rx="0.5" />
        <rect x="11" y="11" width="4" height="4" fill={accentColor} rx="0.5" />
        <rect x="16" y="11" width="4" height="4" fill={primaryColor} rx="0.5" />
        <rect x="21" y="11" width="4" height="4" fill={secondaryColor} opacity="0.7" rx="0.5" />

        {/* Bottom Row */}
        <rect x="6" y="16" width="4" height="4" fill={accentColor} rx="0.5" />
        <rect x="11" y="16" width="4" height="4" fill={primaryColor} rx="0.5" />
        <rect x="16" y="16" width="4" height="4" fill={secondaryColor} rx="0.5" />
        <rect x="21" y="16" width="4" height="4" fill={accentColor} opacity="0.7" rx="0.5" />

        {/* Extra Row */}
        <rect x="6" y="21" width="4" height="4" fill={primaryColor} opacity="0.5" rx="0.5" />
        <rect x="11" y="21" width="4" height="4" fill={secondaryColor} opacity="0.6" rx="0.5" />
        <rect x="16" y="21" width="4" height="4" fill={accentColor} opacity="0.5" rx="0.5" />
        <rect x="21" y="21" width="4" height="4" fill={primaryColor} opacity="0.4" rx="0.5" />
      </g>

      {/* Animated Spark - AI indicator */}
      <circle
        cx="25"
        cy="8"
        r="2"
        fill={primaryColor}
        opacity="0.8"
        className="animate-pulse"
      />
    </svg>
  );
};
