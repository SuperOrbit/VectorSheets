// Premium Design Tokens - Refined Color Palette & Typography
export const designTokens = {
  colors: {
    // Primary Brand
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // Accent Gradient
    accent: {
      from: '#6366f1',
      via: '#8b5cf6',
      to: '#d946ef',
    },
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
    // Glassmorphism
    glass: {
      light: 'rgba(255, 255, 255, 0.7)',
      dark: 'rgba(30, 30, 30, 0.7)',
    },
  },
  typography: {
    fonts: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
  },
  shadows: {
    glow: '0 0 20px rgba(59, 130, 246, 0.5)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    smooth: '0 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: '0 4px 20px rgba(0, 0, 0, 0.12)',
  },
  animations: {
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
