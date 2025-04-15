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
import { fonts } from '../theme/fonts';

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

const CustomAmoledTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Colors.amoled.tint,
    primaryContainer: '#002A38',
    secondary: '#0a7ea4',
    background: Colors.amoled.background,
    surface: Colors.amoled.background,
    surfaceVariant: '#101010',
    text: Colors.amoled.text,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: Colors.amoled.background,
      level1: '#0A0A0A',
      level2: '#111111',
      level3: '#141414',
      level4: '#181818',
      level5: '#1C1C1C',
    },
  },
};

// Layout wrapper that provides the navigation theme
function NavigationRoot() {
  const { theme, isDark, isAmoled } = useThemeContext();
  
  const getPaperTheme = () => {
    if (isAmoled) return CustomAmoledTheme;
    return isDark ? CustomDarkTheme : CustomLightTheme;
  };
  
  const paperTheme = getPaperTheme();
  const navigationTheme = isDark || isAmoled ? DarkTheme : DefaultTheme;
  
  const [fontsLoaded] = useFonts({
    // Regular variants
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Italic': require('../assets/fonts/Nunito-Italic.ttf'),
    
    // Light variants
    'Nunito-Light': require('../assets/fonts/Nunito-Light.ttf'),
    'Nunito-LightItalic': require('../assets/fonts/Nunito-LightItalic.ttf'),
    
    // Extra Light variants
    'Nunito-ExtraLight': require('../assets/fonts/Nunito-ExtraLight.ttf'),
    'Nunito-ExtraLightItalic': require('../assets/fonts/Nunito-ExtraLightItalic.ttf'),
    
    // Semi Bold variants
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-SemiBoldItalic': require('../assets/fonts/Nunito-SemiBoldItalic.ttf'),
    
    // Bold variants
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-BoldItalic': require('../assets/fonts/Nunito-BoldItalic.ttf'),
    
    // Extra Bold variants
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-ExtraBoldItalic': require('../assets/fonts/Nunito-ExtraBoldItalic.ttf'),
    
    // Black variants
    'Nunito-Black': require('../assets/fonts/Nunito-Black.ttf'),
    'Nunito-BlackItalic': require('../assets/fonts/Nunito-BlackItalic.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style={isDark || isAmoled ? 'light' : 'dark'} />
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
