import { useEffect, useState } from 'react';
import { ColorSchemeName, useColorScheme as _useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The useColorScheme value is always either light or dark, but the built-in
// type suggests that it can be null. This will not happen in practice, so this
// makes it a bit easier to work with.
export type ColorScheme = NonNullable<ColorSchemeName>;
export interface ColorSchemeHook {
  colorScheme: ColorScheme;
  setColorScheme: (theme: ColorScheme) => void;
}

export function useColorScheme(): ColorSchemeHook {
  const [colorScheme, setTheme] = useState<ColorScheme>(_useColorScheme() || 'light');
  const systemTheme = _useColorScheme() || 'light';

  // Load theme from storage on first mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        } else {
          // Use system default if no theme is stored
          setTheme(systemTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setTheme(systemTheme);
      }
    };

    loadTheme();
  }, [systemTheme]);

  // Create a function to set the color scheme
  function setColorScheme(newTheme: ColorScheme) {
    setTheme(newTheme);
  }

  return { 
    colorScheme,
    setColorScheme
  };
}
