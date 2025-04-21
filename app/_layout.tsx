import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { FontSizeProvider, useFontSizeContext } from '../contexts/FontSizeContext';
import { Colors } from '../constants/Colors';
import { initFontSize } from '../services/fontSizeService';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Layout wrapper that provides the navigation theme
function NavigationRoot() {
  const { theme, isDark, isAmoled } = useThemeContext();
  const { fontSizes } = useFontSizeContext();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  
  // Adjust font sizes globally
  const baseFontConfig = {
    fontFamily: 'Nunito-Regular',
    fontWeight: 'normal' as 'normal',
    letterSpacing: 0,
  };

  // Custom Paper themes with dynamic font sizes
  const CustomLightTheme = {
    ...MD3LightTheme,
    fonts: {
      ...MD3LightTheme.fonts,
      displayLarge: { ...baseFontConfig, fontSize: fontSizes.h1 * 1.2 },
      displayMedium: { ...baseFontConfig, fontSize: fontSizes.h1 * 1.1 },
      displaySmall: { ...baseFontConfig, fontSize: fontSizes.h1 },
      
      headlineLarge: { ...baseFontConfig, fontSize: fontSizes.h1, fontFamily: 'Nunito-Bold' },
      headlineMedium: { ...baseFontConfig, fontSize: fontSizes.h2, fontFamily: 'Nunito-Bold' },
      headlineSmall: { ...baseFontConfig, fontSize: fontSizes.h3, fontFamily: 'Nunito-Bold' },
      
      titleLarge: { ...baseFontConfig, fontSize: fontSizes.h3, fontFamily: 'Nunito-SemiBold' },
      titleMedium: { ...baseFontConfig, fontSize: fontSizes.h4, fontFamily: 'Nunito-SemiBold' },
      titleSmall: { ...baseFontConfig, fontSize: fontSizes.bodySmall, fontFamily: 'Nunito-SemiBold' },
      
      bodyLarge: { ...baseFontConfig, fontSize: fontSizes.body },
      bodyMedium: { ...baseFontConfig, fontSize: fontSizes.bodySmall },
      bodySmall: { ...baseFontConfig, fontSize: fontSizes.caption },
      
      labelLarge: { ...baseFontConfig, fontSize: fontSizes.body, fontFamily: 'Nunito-Medium' },
      labelMedium: { ...baseFontConfig, fontSize: fontSizes.bodySmall, fontFamily: 'Nunito-Medium' },
      labelSmall: { ...baseFontConfig, fontSize: fontSizes.caption, fontFamily: 'Nunito-Medium' },
    },
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
    fonts: {
      ...MD3DarkTheme.fonts,
      displayLarge: { ...baseFontConfig, fontSize: fontSizes.h1 * 1.2 },
      displayMedium: { ...baseFontConfig, fontSize: fontSizes.h1 * 1.1 },
      displaySmall: { ...baseFontConfig, fontSize: fontSizes.h1 },
      
      headlineLarge: { ...baseFontConfig, fontSize: fontSizes.h1, fontFamily: 'Nunito-Bold' },
      headlineMedium: { ...baseFontConfig, fontSize: fontSizes.h2, fontFamily: 'Nunito-Bold' },
      headlineSmall: { ...baseFontConfig, fontSize: fontSizes.h3, fontFamily: 'Nunito-Bold' },
      
      titleLarge: { ...baseFontConfig, fontSize: fontSizes.h3, fontFamily: 'Nunito-SemiBold' },
      titleMedium: { ...baseFontConfig, fontSize: fontSizes.h4, fontFamily: 'Nunito-SemiBold' },
      titleSmall: { ...baseFontConfig, fontSize: fontSizes.bodySmall, fontFamily: 'Nunito-SemiBold' },
      
      bodyLarge: { ...baseFontConfig, fontSize: fontSizes.body },
      bodyMedium: { ...baseFontConfig, fontSize: fontSizes.bodySmall },
      bodySmall: { ...baseFontConfig, fontSize: fontSizes.caption },
      
      labelLarge: { ...baseFontConfig, fontSize: fontSizes.body, fontFamily: 'Nunito-Medium' },
      labelMedium: { ...baseFontConfig, fontSize: fontSizes.bodySmall, fontFamily: 'Nunito-Medium' },
      labelSmall: { ...baseFontConfig, fontSize: fontSizes.caption, fontFamily: 'Nunito-Medium' },
    },
    colors: {
      ...MD3DarkTheme.colors,
      primary: Colors.dark.tint,
      primaryContainer: '#193548',
      secondary: '#81D4FA',
      background: Colors.dark.background,
      surface: Colors.dark.background,
      surfaceVariant: '#2C2C2C',
      text: Colors.dark.text,
    },
  };

  const CustomAmoledTheme = {
    ...CustomDarkTheme,
    colors: {
      ...CustomDarkTheme.colors,
      background: '#000000',
      surface: '#000000',
      surfaceVariant: '#121212',
    },
  };
  
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
    async function prepare() {
      try {
        // Initialize font size service
        await initFontSize();
        
        // Check onboarding status
        const onboardingStatus = await AsyncStorage.getItem('hasCompletedOnboarding');
        setHasCompletedOnboarding(!!onboardingStatus);
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
      
      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack>
          {!hasCompletedOnboarding && (
            <Stack.Screen 
              name="onboarding" 
              options={{ headerShown: false }} 
            />
          )}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
          <Stack.Screen name="wallpaper" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={isDark || isAmoled ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

// Root layout for the entire app
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <FontSizeProvider>
            <NavigationRoot />
          </FontSizeProvider>
    </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
