import React, { createContext, useState, useContext, useEffect } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'amoled';

interface ThemeContextType {
  theme: ColorScheme;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: ColorScheme) => Promise<void>;
  isDark: boolean;
  isAmoled: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const deviceTheme = _useColorScheme() as ColorScheme || 'light';
  const [theme, setThemeState] = useState<ColorScheme>(deviceTheme);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'amoled') {
          setThemeState(savedTheme as ColorScheme);
        } else {
          // Use device theme if no saved theme
          setThemeState(deviceTheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, [deviceTheme]);

  // Save theme to storage and update state
  const setTheme = async (newTheme: ColorScheme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  // Toggle between light, dark, and amoled
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'amoled' : 'light';
    await setTheme(newTheme);
  };

  const isDark = theme === 'dark' || theme === 'amoled';
  const isAmoled = theme === 'amoled';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark, isAmoled }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}; 