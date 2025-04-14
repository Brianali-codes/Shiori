import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { Colors } from '../constants/Colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Custom Paper themes
const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.light.tint,
    primaryContainer: '#E3F5FF',
    secondary: '#0a7ea4',
    background: Colors.light.background,
    surface: Colors.light.background,
    surfaceVariant: '#F1F3F5',
    text: Colors.light.text,
  },
};

const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.dark.tint,
    primaryContainer: '#003D51',
    secondary: '#0a7ea4',
    background: Colors.dark.background,
    surface: Colors.dark.background,
    surfaceVariant: '#1E1F20',
    text: Colors.dark.text,
  },
};

// Layout wrapper that provides the navigation theme
function NavigationRoot() {
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';
  
  const paperTheme = isDark ? CustomDarkTheme : CustomLightTheme;
  const navigationTheme = isDark ? DarkTheme : DefaultTheme;
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

// Root layout with ThemeProvider
export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavigationRoot />
    </ThemeProvider>
  );
}
