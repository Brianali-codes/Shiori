import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { Theme as NavigationTheme } from '@react-navigation/native';
import { ColorValue } from 'react-native';
import { FontSizes } from '@/constants/FontSizes';

// Create light and dark themes with custom font sizes
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
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: { ...MD3LightTheme.fonts.displayLarge, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h1 },
    displayMedium: { ...MD3LightTheme.fonts.displayMedium, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 },
    displaySmall: { ...MD3LightTheme.fonts.displaySmall, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 },
    
    headlineLarge: { ...MD3LightTheme.fonts.headlineLarge, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h1 },
    headlineMedium: { ...MD3LightTheme.fonts.headlineMedium, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 },
    headlineSmall: { ...MD3LightTheme.fonts.headlineSmall, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 },
    
    titleLarge: { ...MD3LightTheme.fonts.titleLarge, fontFamily: 'Nunito-Medium', fontSize: FontSizes.h3 },
    titleMedium: { ...MD3LightTheme.fonts.titleMedium, fontFamily: 'Nunito-Medium', fontSize: FontSizes.h4 },
    titleSmall: { ...MD3LightTheme.fonts.titleSmall, fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall },
    
    bodyLarge: { ...MD3LightTheme.fonts.bodyLarge, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body },
    bodyMedium: { ...MD3LightTheme.fonts.bodyMedium, fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall },
    bodySmall: { ...MD3LightTheme.fonts.bodySmall, fontFamily: 'Nunito-Regular', fontSize: FontSizes.caption },
    
    labelLarge: { ...MD3LightTheme.fonts.labelLarge, fontFamily: 'Nunito-Medium', fontSize: FontSizes.button },
    labelMedium: { ...MD3LightTheme.fonts.labelMedium, fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall },
    labelSmall: { ...MD3LightTheme.fonts.labelSmall, fontFamily: 'Nunito-Medium', fontSize: FontSizes.caption },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#90CAF9',
    primaryContainer: '#1565C0',
    secondary: '#FF80AB',
    secondaryContainer: '#C2185B',
    tertiary: '#81C784',
    tertiaryContainer: '#2E7D32',
    surface: '#121212',
    surfaceVariant: '#1E1E1E',
    surfaceDisabled: '#1E1E1E',
    background: '#121212',
    error: '#CF6679',
    errorContainer: '#990000',
    onPrimary: '#000000',
    onPrimaryContainer: '#FFFFFF',
    onSecondary: '#000000',
    onSecondaryContainer: '#FFFFFF',
    onTertiary: '#000000',
    onTertiaryContainer: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    onSurfaceDisabled: '#757575',
    onBackground: '#FFFFFF',
    onError: '#000000',
    onErrorContainer: '#FFFFFF',
    outline: '#272727',
    outlineVariant: '#333333',
    inverseSurface: '#FFFFFF',
    inverseOnSurface: '#000000',
    inversePrimary: '#1976D2',
    shadow: 'rgba(0, 0, 0, 0.2)',
    scrim: 'rgba(0, 0, 0, 0.6)',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
  fonts: {
    ...MD3DarkTheme.fonts,
    displayLarge: { ...MD3DarkTheme.fonts.displayLarge, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h1 },
    displayMedium: { ...MD3DarkTheme.fonts.displayMedium, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 },
    displaySmall: { ...MD3DarkTheme.fonts.displaySmall, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 },
    
    headlineLarge: { ...MD3DarkTheme.fonts.headlineLarge, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h1 },
    headlineMedium: { ...MD3DarkTheme.fonts.headlineMedium, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 },
    headlineSmall: { ...MD3DarkTheme.fonts.headlineSmall, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 },
    
    titleLarge: { ...MD3DarkTheme.fonts.titleLarge, fontFamily: 'Nunito-Medium', fontSize: FontSizes.h3 },
    titleMedium: { ...MD3DarkTheme.fonts.titleMedium, fontFamily: 'Nunito-Medium', fontSize: FontSizes.h4 },
    titleSmall: { ...MD3DarkTheme.fonts.titleSmall, fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall },
    
    bodyLarge: { ...MD3DarkTheme.fonts.bodyLarge, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body },
    bodyMedium: { ...MD3DarkTheme.fonts.bodyMedium, fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall },
    bodySmall: { ...MD3DarkTheme.fonts.bodySmall, fontFamily: 'Nunito-Regular', fontSize: FontSizes.caption },
    
    labelLarge: { ...MD3DarkTheme.fonts.labelLarge, fontFamily: 'Nunito-Medium', fontSize: FontSizes.button },
    labelMedium: { ...MD3DarkTheme.fonts.labelMedium, fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall },
    labelSmall: { ...MD3DarkTheme.fonts.labelSmall, fontFamily: 'Nunito-Medium', fontSize: FontSizes.caption },
  },
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

// Re-export theme type for TypeScript
export type Theme = typeof lightTheme;

// Adapt navigation theme to paper theme for consistency
export const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: {
    dark: false,
    colors: {
      primary: lightTheme.colors.primary,
      background: lightTheme.colors.background,
      card: lightTheme.colors.surface,
      text: lightTheme.colors.onSurface,
      border: lightTheme.colors.outline,
      notification: lightTheme.colors.error,
    },
  },
  reactNavigationDark: {
    dark: true,
    colors: {
      primary: darkTheme.colors.primary,
      background: darkTheme.colors.background,
      card: darkTheme.colors.surface,
      text: darkTheme.colors.onSurface,
      border: darkTheme.colors.outline,
      notification: darkTheme.colors.error,
    },
  },
}); 