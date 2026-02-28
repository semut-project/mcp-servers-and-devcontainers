import * as React from 'react';
import { 
  createLightTheme, 
  createDarkTheme, 
  BrandVariants, 
  Theme, 
  webLightTheme, 
  webDarkTheme 
} from '@fluentui/react-components';
import { FluentProvider } from '@fluentui/react-components';

export interface FluentThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

export const FluentThemeContext = React.createContext<FluentThemeContextType | undefined>(undefined);

// Custom brand colors for KYC Document Management System
const kycBrandVariants: BrandVariants = {
  10: '#00188F',
  20: '#0027B1',
  30: '#0037CE',
  40: '#0046EC',
  50: '#0A56FF',
  60: '#2866FF',
  70: '#4576FF',
  80: '#6286FF',
  90: '#7E96FF',
  100: '#9AA7FF',
  110: '#B6B8FF',
  120: '#D2CAFF',
  130: '#EEDCFF',
  140: '#FFEEFF',
  150: '#FFFFFF',
  160: '#FFFFFF'
};

// Create custom themes
const lightTheme: Theme = {
  ...createLightTheme(kycBrandVariants),
  ...webLightTheme
};

const darkTheme: Theme = {
  ...createDarkTheme(kycBrandVariants),
  ...webDarkTheme
};

interface FluentThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark' | 'system';
  initialTheme?: boolean; // true for dark, false for light - overrides defaultTheme
}

export const FluentThemeProvider: React.FC<FluentThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  initialTheme
}) => {
  const [currentTheme, setCurrentTheme] = React.useState<Theme>(lightTheme);
  const [isDarkMode, setIsDarkMode] = React.useState<boolean>(false);

  // Detect system preference
  const prefersDark = React.useMemo(() => {
    // Check if window and matchMedia are available (useful for SSR and testing)
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, []);

  // Initialize theme based on default preference
  React.useEffect(() => {
    let initialTheme: Theme = lightTheme;
    let initialIsDark = false;

    // Use initialTheme if provided (overrides defaultTheme)
    if (initialTheme !== undefined) {
      initialTheme = initialTheme ? darkTheme : lightTheme;
      initialIsDark = initialTheme === darkTheme;
    } else {
      // Fall back to defaultTheme logic
      switch (defaultTheme) {
        case 'dark':
          initialTheme = darkTheme;
          initialIsDark = true;
          break;
        case 'system':
          initialTheme = prefersDark ? darkTheme : lightTheme;
          initialIsDark = prefersDark;
          break;
        default:
          initialTheme = lightTheme;
          initialIsDark = false;
      }
    }

    setCurrentTheme(initialTheme);
    setIsDarkMode(initialIsDark);
  }, [defaultTheme, prefersDark, initialTheme]);

  const setTheme = React.useCallback((theme: Theme) => {
    setCurrentTheme(theme);
    setIsDarkMode(theme === darkTheme);
  }, []);

  const toggleTheme = React.useCallback(() => {
    const newTheme = isDarkMode ? lightTheme : darkTheme;
    setCurrentTheme(newTheme);
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  const contextValue: FluentThemeContextType = React.useMemo(() => ({
    theme: currentTheme,
    setTheme,
    isDark: isDarkMode,
    toggleTheme
  }), [currentTheme, setTheme, isDarkMode, toggleTheme]);

  console.log('[FluentThemeProvider] Rendering with theme:', currentTheme);

  return (
    <FluentThemeContext.Provider value={contextValue}>
      <FluentProvider theme={currentTheme}>
        {children}
      </FluentProvider>
    </FluentThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useFluentTheme = (): FluentThemeContextType => {
  const context = React.useContext(FluentThemeContext);
  if (!context) {
    throw new Error('useFluentTheme must be used within a FluentThemeProvider');
  }
  return context;
};

// Helper function to get theme tokens
export const getFluentThemeTokens = (theme: Theme) => ({
  colorNeutralForeground1: theme.colorNeutralForeground1,
  colorNeutralForeground2: theme.colorNeutralForeground2,
  colorNeutralBackground1: theme.colorNeutralBackground1,
  colorNeutralBackground2: theme.colorNeutralBackground2,
  colorBrandBackground: theme.colorBrandBackground,
  colorBrandForeground1: theme.colorBrandForeground1,
  borderRadiusMedium: theme.borderRadiusMedium,
  borderRadiusLarge: theme.borderRadiusLarge,
  fontFamilyBase: theme.fontFamilyBase,
  fontSizeBase300: theme.fontSizeBase300,
  fontSizeBase400: theme.fontSizeBase400,
  fontSizeBase500: theme.fontSizeBase500,
  fontWeightRegular: theme.fontWeightRegular,
  fontWeightSemibold: theme.fontWeightSemibold,
  spacingHorizontalS: theme.spacingHorizontalS,
  spacingHorizontalM: theme.spacingHorizontalM,
  spacingHorizontalL: theme.spacingHorizontalL,
  spacingVerticalS: theme.spacingVerticalS,
  spacingVerticalM: theme.spacingVerticalM,
  spacingVerticalL: theme.spacingVerticalL,
});
