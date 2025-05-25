// Modern Finance Dashboard Theme Configuration

export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d'
    },
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f'
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    glass: {
      white: 'rgba(255, 255, 255, 0.1)',
      dark: 'rgba(0, 0, 0, 0.1)',
      border: 'rgba(255, 255, 255, 0.2)'
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    success: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    danger: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    warning: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    info: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    dark: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
    mesh: 'radial-gradient(at 47% 33%, hsl(162.00, 77%, 40%) 0, transparent 59%), radial-gradient(at 82% 65%, hsl(218.00, 39%, 11%) 0, transparent 55%)'
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
  },
  animations: {
    fadeIn: 'fadeIn 0.5s ease-in-out',
    slideIn: 'slideIn 0.3s ease-out',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    float: 'float 3s ease-in-out infinite',
    glow: 'glow 2s ease-in-out infinite alternate'
  }
};

export const chartTheme = {
  colors: ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'],
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  grid: {
    stroke: '#e5e7eb',
    strokeDasharray: '3 3'
  },
  axis: {
    stroke: '#9ca3af'
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
};