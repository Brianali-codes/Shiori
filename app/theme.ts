import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { Theme as NavigationTheme, DefaultTheme as RNDefaultTheme, DarkTheme as RNDarkTheme } from '@react-navigation/native';
import { ColorValue } from 'react-native';

// Note: We no longer directly import FontSizes here
// The new approach uses FontSizeContext for dynamic updates

// Create light and dark themes that will be customized via context in _layout.tsx
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#2196f3',
    primaryContainer: '#E3F2FD',
    secondary: '#f50057',
    secondaryContainer: '#FFEBED',
    tertiary: '#4CAF50',
    tertiaryContainer: '#E8F5E9',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    surfaceDisabled: '#F5F5F5',
    background: '#FFFFFF',
    error: '#B00020',
    errorContainer: '#FFDBDB',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#004D90',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#C10043',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1B5E20',
    onSurface: '#000000',
    onSurfaceVariant: '#757575',
    onSurfaceDisabled: '#9E9E9E',
    onBackground: '#000000',
    onError: '#FFFFFF',
    onErrorContainer: '#B00020',
    outline: '#E0E0E0',
    outlineVariant: '#EEEEEE',
    inverseSurface: '#121212',
    inverseOnSurface: '#FFFFFF',
    inversePrimary: '#90CAF9',
    shadow: 'rgba(0, 0, 0, 0.1)',
    scrim: 'rgba(0, 0, 0, 0.3)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
  },
  // Note: Font configurations moved to _layout.tsx where they have access to fontSizes from context
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#193548',
    secondary: '#f48fb1',
    secondaryContainer: '#731830',
    tertiary: '#81C784',
    tertiaryContainer: '#1B4E22',
    surface: '#121212',
    surfaceVariant: '#2C2C2C',
    surfaceDisabled: '#2C2C2C',
    background: '#121212',
    error: '#CF6679',
    errorContainer: '#5B0011',
    onPrimary: '#000000',
    onPrimaryContainer: '#FFFFFF',
    onSecondary: '#000000',
    onSecondaryContainer: '#FFFFFF',
    onTertiary: '#000000',
    onTertiaryContainer: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    onSurfaceDisabled: '#666666',
    onBackground: '#FFFFFF',
    onError: '#000000',
    onErrorContainer: '#FFFFFF',
    outline: '#444444',
    outlineVariant: '#333333',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#000000',
    inversePrimary: '#1976D2',
    shadow: 'rgba(0, 0, 0, 0.24)',
    scrim: 'rgba(0, 0, 0, 0.6)',
    backdrop: 'rgba(0, 0, 0, 0.8)',
  },
  // Note: Font configurations moved to _layout.tsx where they have access to fontSizes from context
};

// We need a special AMOLED theme with pure black for OLED screens
export const amoledTheme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    background: '#000000',
    surface: '#000000',
    surfaceVariant: '#121212',
  },
};

// Export the Theme type for TypeScript compatibility
export type Theme = typeof lightTheme;

// Helper function to adapt navigation theme to match paper theme
export const getNavigationTheme = (isDark: boolean) => {
  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: RNDefaultTheme,
    reactNavigationDark: RNDarkTheme,
  });
  
  return isDark ? DarkTheme : LightTheme;
}; 