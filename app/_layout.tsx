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
import * as Application from 'expo-application';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { FontSizeProvider, useFontSizeContext } from '../contexts/FontSizeContext';
import { Colors } from '../constants/Colors';
import { initFontSize } from '../services/fontSizeService';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
// Current app version - update this when you want to show onboarding again after an update
const CURRENT_APP_VERSION = '1.0.1'; // Replace with your actual version
const ONBOARDING_VERSION_KEY = 'onboardingCompletedForVersion';
function NavigationRoot() {
  const { theme, isDark, isAmoled } = useThemeContext();
  const { fontSizes } = useFontSizeContext();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState<boolean | null>(null);
  const baseFontConfig = {
    fontFamily: 'Nunito-Regular',
    fontWeight: 'normal' as const,
    letterSpacing: 0,
  };
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
    fonts: CustomLightTheme.fonts,
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
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-Italic': require('../assets/fonts/Nunito-Italic.ttf'),
    'Nunito-Light': require('../assets/fonts/Nunito-Light.ttf'),
    'Nunito-LightItalic': require('../assets/fonts/Nunito-LightItalic.ttf'),
    'Nunito-ExtraLight': require('../assets/fonts/Nunito-ExtraLight.ttf'),
    'Nunito-ExtraLightItalic': require('../assets/fonts/Nunito-ExtraLightItalic.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-SemiBoldItalic': require('../assets/fonts/Nunito-SemiBoldItalic.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'Nunito-BoldItalic': require('../assets/fonts/Nunito-BoldItalic.ttf'),
    'Nunito-ExtraBold': require('../assets/fonts/Nunito-ExtraBold.ttf'),
    'Nunito-ExtraBoldItalic': require('../assets/fonts/Nunito-ExtraBoldItalic.ttf'),
    'Nunito-Black': require('../assets/fonts/Nunito-Black.ttf'),
    'Nunito-BlackItalic': require('../assets/fonts/Nunito-BlackItalic.ttf'),
  });
  useEffect(() => {
    async function prepare() {
      try {
        await initFontSize();

        // Test AsyncStorage functionality
        console.log('Testing AsyncStorage functionality...');
        const testKey = 'asyncStorageTest';
        const testValue = 'test-' + Date.now();
        
        try {
          await AsyncStorage.setItem(testKey, testValue);
          const retrievedValue = await AsyncStorage.getItem(testKey);
          
          if (retrievedValue === testValue) {
            console.log('AsyncStorage test successful');
          } else {
            console.error('AsyncStorage test failed - value mismatch');
          }
        } catch (asyncError) {
          console.error('AsyncStorage test failed with error:', asyncError);
        }

        // Force show onboarding for testing
        const forceShowOnboarding = true; // Set to true to force onboarding

        // Check if onboarding should be shown
        const completedVersion = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
        console.log('Onboarding check - Completed version:', completedVersion);
        console.log('Current app version:', CURRENT_APP_VERSION);

        // Show onboarding if:
        // 1. No version is stored (first install)
        // 2. Stored version is different from current version (app update)
        // 3. Force show onboarding is true
        if (forceShowOnboarding || !completedVersion || completedVersion !== CURRENT_APP_VERSION) {
          console.log('Should show onboarding: true');
          setShouldShowOnboarding(true);
          
          // For debugging - if we're forcing onboarding, clear the stored version
          if (forceShowOnboarding) {
            await AsyncStorage.removeItem(ONBOARDING_VERSION_KEY);
            console.log('Forced onboarding - cleared stored version');
          }
        } else {
          console.log('Should show onboarding: false');
          setShouldShowOnboarding(false);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        // Default to showing onboarding in case of error
        setShouldShowOnboarding(true);
      }

      if (fontsLoaded) {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, [fontsLoaded]);

  // Mark onboarding as completed for this version
  const completeOnboarding = async () => {
    try {
      console.log('Completing onboarding from _layout - Setting key:', ONBOARDING_VERSION_KEY);
      console.log('Completing onboarding from _layout - Setting value:', CURRENT_APP_VERSION);
      await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_APP_VERSION);
      console.log('Completing onboarding from _layout - AsyncStorage set successfully');
      setShouldShowOnboarding(false);
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
    }
  };

  // For testing - reset onboarding status
  const resetOnboarding = async () => {
    try {
      console.log('Resetting onboarding status...');
      await AsyncStorage.removeItem(ONBOARDING_VERSION_KEY);
      console.log('Onboarding status reset successfully');
      // Force reload the app
      setShouldShowOnboarding(true);
    } catch (error) {
      console.error('Failed to reset onboarding status:', error);
    }
  };



  if (!fontsLoaded || shouldShowOnboarding === null) return null;

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationThemeProvider value={navigationTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {shouldShowOnboarding ? (
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
              initialParams={{ completeOnboarding }}
            />
          ) : (
            <>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              {/* Add other screens that should be available after onboarding */}
            </>
          )}
        </Stack>
        <StatusBar style={isDark || isAmoled ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </PaperProvider>
  );
}

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