import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Animated, Easing, Platform, Linking, ToastAndroid } from 'react-native';
import { List, Text, Divider, Avatar, Button, IconButton, Surface, useTheme, Dialog, Portal, TextInput, ActivityIndicator, Card, RadioButton } from 'react-native-paper';
import { Setting2, Moon, Sun, Paintbucket, Shield, Folder, Gallery, Lock, Notification, InfoCircle, MessageQuestion, ArrowRight2, Key, Wifi, Star, Trash, Eye, Message, Share } from 'iconsax-react-nativejs';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { useThemeContext } from '../../contexts/ThemeContext';
import { wallhavenAPI, setHighQualityMode } from '../services/wallhaven';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useFontSizeContext } from '@/contexts/FontSizeContext';
import * as FileSystem from 'expo-file-system';

// Custom Animated Switch component
interface AnimatedSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({ value, onValueChange, disabled = false }) => {
  const paperTheme = useTheme();
  const translateX = useRef(new Animated.Value(value ? 20 : 0)).current;
  const switchScale = useRef(new Animated.Value(value ? 1 : 0.9)).current;
  const backgroundColorAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: value ? 20 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(switchScale, {
        toValue: value ? 1 : 0.9,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: true,
      }),
      Animated.timing(backgroundColorAnim, {
        toValue: value ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }),
    ]).start();
  }, [value, translateX, switchScale, backgroundColorAnim]);

  const backgroundColor = backgroundColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [paperTheme.dark ? '#555555' : '#E0E0E0', paperTheme.colors.primary],
  });

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      disabled={disabled}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View 
        style={[
          switchStyles.track,
          { backgroundColor },
        ]}
      >
        <Animated.View
          style={[
            switchStyles.thumb,  
            {
              transform: [
                { translateX },
                { scale: switchScale }
              ],
              backgroundColor: paperTheme.dark ? '#FFFFFF' : '#FFFFFF',
              elevation: value ? 2 : 1,
            },
          ]}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

// Styles for the switch
const switchStyles = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, setTheme, isDark, isAmoled } = useThemeContext();
  const paperTheme = useTheme();
  const fontSizeContext = useFontSizeContext();
  const { fontSizes } = fontSizeContext;
  const fontSizeContextRef = useRef(fontSizeContext);
  
  useEffect(() => {
    fontSizeContextRef.current = fontSizeContext;
  }, [fontSizeContext]);

  // Authentication states
  const [authState, setAuthState] = useState({
    wallhavenAuthVisible: false,
    loading: false,
    username: null as string | null,
    apiKey: '',
    hasApiKey: false
  });

  // App settings states
  const [settings, setSettings] = useState({
    notifications: true,
    downloadOnWifi: true,
    highQualityThumbs: false,
    autoDownloadOnFavorite: false,
    showNsfwContent: false,
    fontSize: 'small' as 'small' | 'medium' | 'large',
    downloadLocation: 'gallery' as 'gallery' | 'private'
  });

  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    theme: false,
    fontSize: false,
    cache: false,
    nsfw: false,
    highQuality: false,
    wifiOnly: false,
    notifications: false,
    apiKey: false,
    autoDownload: false,
    downloadLocation: false,
    favorites: false
  });

  // Dialog states
  const [dialogStates, setDialogStates] = useState({
    fontSizeVisible: false,
    downloadLocationVisible: false
  });

  const [manualKeyDialogVisible, setManualKeyDialogVisible] = useState(false);
  const [inputApiKey, setInputApiKey] = useState('');

  const webViewRef = useRef<WebView>(null);

  const [clearFavoritesDialogVisible, setClearFavoritesDialogVisible] = useState(false);
  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);

  const [aboutDialogVisible, setAboutDialogVisible] = useState(false);
  const [contactDialogVisible, setContactDialogVisible] = useState(false);

  // Helper functions to update state
  const updateAuthState = (updates: Partial<typeof authState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  };

  const updateSettings = (updates: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateLoadingStates = (updates: Partial<typeof loadingStates>) => {
    setLoadingStates(prev => ({ ...prev, ...updates }));
  };

  const updateDialogStates = (updates: Partial<typeof dialogStates>) => {
    setDialogStates(prev => ({ ...prev, ...updates }));
  };

  // Load saved settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load API key
        const savedKey = await AsyncStorage.getItem('wallhavenApiKey');
        if (savedKey) {
          // Set the API key to the API service and update status
          wallhavenAPI.setApiKey(savedKey);
          updateAuthState({ hasApiKey: true });
        }

        // Load username
        const savedUsername = await AsyncStorage.getItem('wallhavenUsername');
        if (savedUsername) {
          updateAuthState({ username: savedUsername });
        }

        // Load NSFW setting - now check if API key exists before loading
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        if (nsfwSetting === 'true' && savedKey) { 
          // Only enable NSFW if API key exists
          updateSettings({ showNsfwContent: true });
        }
        
        // Load Download Location setting
        const savedDownloadLocation = await AsyncStorage.getItem('downloadLocation');
        if (savedDownloadLocation && (savedDownloadLocation === 'gallery' || savedDownloadLocation === 'private')) {
          updateSettings({ downloadLocation: savedDownloadLocation as 'gallery' | 'private' });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSignOut = async () => {
    try {
      updateAuthState({ loading: true });
      // Clear stored credentials
      await AsyncStorage.multiRemove(['wallhavenApiKey', 'wallhavenUsername']);
      updateAuthState({
        username: null,
        apiKey: '',
        loading: false,
        hasApiKey: false
      });
      wallhavenAPI.setApiKey('');
      
      // Also turn off NSFW content when signing out
      updateSettings({ showNsfwContent: false });
      await AsyncStorage.setItem('showNsfwContent', 'false');
      
      Alert.alert('Success', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Failed to sign out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
      updateAuthState({ loading: false });
    }
  };

  const handleWebViewMessage = async (event: any) => {
    const newApiKey = event.nativeEvent.data;
    
    if (newApiKey) {
      try {
        // Update UI to show loading state
        updateAuthState({ loading: true });
        
        // Set the API key to the API service
        wallhavenAPI.setApiKey(newApiKey);
        
        // Attempt to validate the key by making a request
        try {
          const settings = await wallhavenAPI.getUserSettings();
          
          // If we get here, the API key is valid
          await AsyncStorage.setItem('wallhavenApiKey', newApiKey);
          
          // Save username if available
          if (settings && settings.username) {
            await AsyncStorage.setItem('wallhavenUsername', settings.username);
            updateAuthState({
              username: settings.username,
              apiKey: newApiKey,
              wallhavenAuthVisible: false,
              loading: false,
              hasApiKey: true
            });
          } else {
            // No username but key is valid
            updateAuthState({
              apiKey: newApiKey,
              wallhavenAuthVisible: false,
              loading: false,
              hasApiKey: true
            });
          }
          
          Alert.alert('Success', 'Successfully connected to Wallhaven!');
        } catch (apiError) {
          console.error('API validation failed:', apiError);
          updateAuthState({ loading: false });
          Alert.alert('Invalid API Key', 'The API key could not be verified. Please check and try again.');
        }
      } catch (error) {
        console.error('Failed during API key processing:', error);
        updateAuthState({ loading: false });
        Alert.alert('Error', 'An error occurred while processing your login. Please try again.');
      }
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'amoled') => {
    try {
      updateLoadingStates({ theme: true });
      await setTheme(newTheme);
      // Add a small delay to ensure the theme change is perceived by the user
      setTimeout(() => {
        updateLoadingStates({ theme: false });
      }, 800);
    } catch (error) {
      console.error('Failed to save theme:', error);
      updateLoadingStates({ theme: false });
    }
  };

  const handleApiKeySubmit = async () => {
    try {
      // Show loading indicator
      setLoadingStates(prev => ({ ...prev, apiKey: true }));
      
      // Set the API key to test it
      wallhavenAPI.setApiKey(authState.apiKey);
      
      // Test the API key by making a request
      try {
        const settings = await wallhavenAPI.getUserSettings();
        
        // If we get here, the key is valid - save it
        await AsyncStorage.setItem('wallhavenApiKey', authState.apiKey);
        
        // Save username if available
        if (settings && settings.username) {
          await AsyncStorage.setItem('wallhavenUsername', settings.username);
          updateAuthState({ 
            username: settings.username,
            apiKey: authState.apiKey
          });
        }
        
        // Clear the input and show success
        updateAuthState({ apiKey: '' });
        Alert.alert('Success', 'API key has been saved and verified successfully.');
      } catch (apiError) {
        // Invalid API key
        Alert.alert('Invalid API Key', 'Please check your API key and try again.');
      }
    } catch (error) {
      console.error('API key validation failed:', error);
      Alert.alert('Error', 'Failed to validate API key. Please try again.');
    } finally {
      // Hide loading indicator
      setLoadingStates(prev => ({ ...prev, apiKey: false }));
    }
  };

  // Save NSFW setting when it changes with loading indicator
  const handleNsfwToggle = async (value: boolean) => {
    if (value && !authState.hasApiKey) {
      // If trying to enable NSFW without API key, show API key dialog
      Alert.alert(
        'API Key Required',
        'To view NSFW content, you need to set your Wallhaven API key. You can get this from your Wallhaven account settings at wallhaven.cc.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Set API Key', 
            onPress: () => updateAuthState({ wallhavenAuthVisible: true })
          }
        ]
      );
      return;
    }

    updateLoadingStates({ nsfw: true });
    updateSettings({ showNsfwContent: value });
    
    try {
      await AsyncStorage.setItem('showNsfwContent', value ? 'true' : 'false');
      
      // Important: Update the NSFW filter in the wallhaven API
      // This ensures the API applies the correct filter settings
      wallhavenAPI.updateNsfwFilter(value);
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ nsfw: false });
        
        // If NSFW is being disabled, force a refresh of all screens to show SFW content only
        if (!value) {
          // Force a refresh of the home screen
          router.replace('/');
          // Force a refresh of the explore screen
          router.replace('/explore');
        }
      }, 600);
    } catch (error) {
      console.error('Failed to save NSFW setting:', error);
      updateLoadingStates({ nsfw: false });
    }
  };

  // Handle high quality toggle with loading indicator
  const handleHighQualityToggle = async (value: boolean) => {
    updateLoadingStates({ highQuality: true });
    updateSettings({ highQualityThumbs: value });
    
    try {
      await AsyncStorage.setItem('highQualityThumbs', value ? 'true' : 'false');
      setHighQualityMode(value);
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ highQuality: false });
      }, 600);
    } catch (error) {
      console.error('Failed to save high quality setting:', error);
      updateLoadingStates({ highQuality: false });
    }
  };

  // Handle auto-download on favorite toggle
  const handleAutoDownloadToggle = async (value: boolean) => {
    updateLoadingStates({ autoDownload: true });
    updateSettings({ autoDownloadOnFavorite: value });
    
    try {
      await AsyncStorage.setItem('autoDownloadOnFavorite', value ? 'true' : 'false');
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ autoDownload: false });
      }, 600);
    } catch (error) {
      console.error('Failed to save auto-download setting:', error);
      updateLoadingStates({ autoDownload: false });
    }
  };

  // Load font size setting on component mount
  useEffect(() => {
    const loadFontSizeSetting = async () => {
      try {
        const savedFontSize = await AsyncStorage.getItem('fontSizeOption');
        if (savedFontSize && (savedFontSize === 'small' || savedFontSize === 'medium' || savedFontSize === 'large')) {
          updateSettings({ fontSize: savedFontSize as 'small' | 'medium' | 'large' });
        }
      } catch (error) {
        console.error('Failed to load font size setting:', error);
      }
    };
    loadFontSizeSetting();
  }, []);

  const clearFavorites = async () => {
    setClearFavoritesDialogVisible(true);
  };

  const clearCache = async () => {
    setClearCacheDialogVisible(true);
  };

  const showAbout = () => {
    setAboutDialogVisible(true);
  };

  const showContact = () => {
    setContactDialogVisible(true);
  };

  // Handle font size change
  const handleFontSizeChange = async (value: string) => {
    if (value === 'small' || value === 'medium' || value === 'large') {
      updateLoadingStates({ fontSize: true });
      
      try {
        // Don't use hooks here - access the context outside and pass it in
        await AsyncStorage.setItem('fontSizeOption', value);
        
        // Update the local state
        updateSettings({ fontSize: value as 'small' | 'medium' | 'large' });
        
        // Show a brief loading indicator for visual feedback
        setTimeout(() => {
          updateLoadingStates({ fontSize: false });
          
          // Use the FontSizeContext's refreshFontSizes method to update fonts
          fontSizeContextRef.current?.setFontSize(value as 'small' | 'medium' | 'large');
          
          // Show success toast
          if (Platform.OS === 'android') {
            ToastAndroid.show('Font size updated', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Font size has been updated');
          }
          
          // Close dialog if this was called from the dialog buttons
          updateDialogStates({ fontSizeVisible: false });
        }, 600);
        
      } catch (error) {
        console.error('Failed to save font size setting:', error);
        updateLoadingStates({ fontSize: false });
      }
    }
  };

  // Handle Wi-Fi only toggle with loading indicator
  const handleWifiOnlyToggle = async (value: boolean) => {
    updateLoadingStates({ wifiOnly: true });
    updateSettings({ downloadOnWifi: value });
    
    try {
      await AsyncStorage.setItem('downloadOnWifi', value ? 'true' : 'false');
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ wifiOnly: false });
      }, 600);
    } catch (error) {
      console.error('Failed to save Wi-Fi only setting:', error);
      updateLoadingStates({ wifiOnly: false });
    }
  };
  
  // Handle notifications toggle with loading indicator
  const handleNotificationsToggle = async (value: boolean) => {
    updateLoadingStates({ notifications: true });
    updateSettings({ notifications: value });
    
    try {
      await AsyncStorage.setItem('notifications', value ? 'true' : 'false');
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ notifications: false });
      }, 600);
    } catch (error) {
      console.error('Failed to save notifications setting:', error);
      updateLoadingStates({ notifications: false });
    }
  };

  const handleWallhavenAuth = () => {
    updateAuthState({ wallhavenAuthVisible: true });
  };

  const handleWebViewNavigationStateChange = (newNavState: any) => {
    const { url } = newNavState;
    
    // Check if we've reached the settings page after login
    if (url.includes('wallhaven.cc/settings/account')) {
      // We're on the settings page, inject JS to extract the API key
      if (webViewRef.current) {
        const injectedJavaScript = `
          setTimeout(() => {
            const apiKeyInput = document.querySelector('input[name="apikey"]');
            if (apiKeyInput) {
              window.ReactNativeWebView.postMessage(apiKeyInput.value);
            } else {
              window.ReactNativeWebView.postMessage('');
            }
          }, 1000); // Give the page a second to fully load
          true;
        `;
        webViewRef.current.injectJavaScript(injectedJavaScript);
      }
    }
  };

  const openWallhavenWebsite = () => {
    Linking.openURL('https://wallhaven.cc/login');
  };

  const showManualKeyDialog = () => {
    setManualKeyDialogVisible(true);
    updateAuthState({ wallhavenAuthVisible: false });
  };

  const hideManualKeyDialog = () => {
    setManualKeyDialogVisible(false);
    setInputApiKey('');
  };

  const handleManualApiKeySave = async () => {
    if (inputApiKey && inputApiKey.trim() !== '') {
      try {
        updateAuthState({ loading: true });
        
        // Set the API key to the API service
        wallhavenAPI.setApiKey(inputApiKey);
        
        try {
          const settings = await wallhavenAPI.getUserSettings();
          await AsyncStorage.setItem('wallhavenApiKey', inputApiKey);
          
          // Save username if available in response
          if (settings && settings.username) {
            await AsyncStorage.setItem('wallhavenUsername', settings.username);
            updateAuthState({
              username: settings.username,
              apiKey: '',
              loading: false,
              hasApiKey: true
            });
          } else {
            // No username but key is valid
            updateAuthState({
              apiKey: '',
              loading: false,
              hasApiKey: true
            });
          }
          
          Alert.alert('Success', 'API key validated and saved successfully!');
        } catch (error) {
          console.error('API validation failed:', error);
          updateAuthState({ loading: false });
          Alert.alert('Invalid API Key', 'The API key could not be verified. Please check and try again.');
        }
      } catch (error) {
        console.error('Failed to save API key:', error);
        updateAuthState({ loading: false });
      } finally {
        setInputApiKey('');
        setManualKeyDialogVisible(false);
      }
    } else {
      Alert.alert('Error', 'Please enter a valid API key');
    }
  };

  // Add this function to remove the API key
  const handleRemoveApiKey = async () => {
    try {
      updateAuthState({ loading: true });
      
      // Clear stored API key
      await AsyncStorage.removeItem('wallhavenApiKey');
      
      // Reset Wallhaven API
      wallhavenAPI.setApiKey('');
      
      // Also disable NSFW content since it requires an API key
      await AsyncStorage.setItem('showNsfwContent', 'false');
      updateSettings({ showNsfwContent: false });
      
      // Update auth state
      updateAuthState({
        hasApiKey: false,
        loading: false
      });
      
      // Call the API to force global NSFW settings update
      wallhavenAPI.updateNsfwFilter(false);
      
      Alert.alert('Success', 'API key has been removed successfully.');
    } catch (error) {
      console.error('Failed to remove API key:', error);
      updateAuthState({ loading: false });
      Alert.alert('Error', 'Failed to remove API key. Please try again.');
    }
  };

  // Handle download location change
  const handleDownloadLocationChange = async (value: string) => {
    if (value === 'gallery' || value === 'private') {
      updateLoadingStates({ downloadLocation: true });
      
      try {
        await AsyncStorage.setItem('downloadLocation', value);
        updateSettings({ downloadLocation: value as 'gallery' | 'private' });
        
        // Show a brief loading indicator
        setTimeout(() => {
          updateLoadingStates({ downloadLocation: false });
          updateDialogStates({ downloadLocationVisible: false });
          if (Platform.OS === 'android') {
            ToastAndroid.show('Download location updated', ToastAndroid.SHORT);
          } else {
            Alert.alert('Success', 'Download location updated');
          }
        }, 600);
        
      } catch (error) {
        console.error('Failed to save download location setting:', error);
        updateLoadingStates({ downloadLocation: false });
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen
          options={{
            title: 'Settings',
            headerShadowVisible: false,
          }}
        />
        
        <ScrollView>
          <Card style={styles.userCard} mode="elevated">
            <Card.Content>
              <View style={styles.userInfo}>
                <Avatar.Icon 
                  icon={() => <Key variant="Broken" size={30} color={paperTheme.colors.primary} />} 
                  size={60} 
                  style={{ backgroundColor: paperTheme.colors.surfaceVariant }}
                />
                <View style={styles.userDetails}>
                  <Text variant="titleMedium" style={{ fontSize: fontSizes.h4 }}>{authState.username || 'Guest User'}</Text>
                  <Text variant="bodySmall" style={[styles.userSubtitle, { fontSize: fontSizes.caption }]}>
                    {authState.username ? 'Wallhaven Account Connected' : 'Add your API key for more features'}
                  </Text>
                </View>
              </View>
              {authState.username ? (
                <Button 
                  mode="contained-tonal" 
                  style={styles.signInButton}
                  onPress={handleSignOut}
                  loading={authState.loading}
                  disabled={authState.loading}
                  labelStyle={{ fontSize: fontSizes.body }}
                >
                  Sign Out
                </Button>
              ) : (
                <Button 
                  mode="contained-tonal" 
                  style={styles.signInButton}
                  onPress={handleWallhavenAuth}
                  loading={authState.loading}
                  disabled={authState.loading}
                  labelStyle={{ fontSize: fontSizes.body }}
                  icon={({size, color}) => (
                    <Key variant="Broken" size={20} color={color} />
                  )}
                >
                  Get Your API Key
                </Button>
              )}
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>APPEARANCE</Text>
              
              <View style={styles.themeOptions}>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'light' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('light')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#FFFFFF' }]} />
                  <ThemedText style={[styles.themeText, { fontSize: fontSizes.caption }]}>Light</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'dark' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('dark')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#151718' }]} />
                  <ThemedText style={[styles.themeText, { fontSize: fontSizes.caption }]}>Dark</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'amoled' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('amoled')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#000000' }]} />
                  <ThemedText style={[styles.themeText, { fontSize: fontSizes.caption }]}>AMOLED</ThemedText>
                </TouchableOpacity>
              </View>
              
              <List.Item
                title="Font Size"
                titleStyle={{ fontSize: fontSizes.body }}
                description={`${settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)} text scaling`}
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Setting2 variant="Broken" size={size} color={color} />
                )} />}
                onPress={() => updateDialogStates({ fontSizeVisible: true })}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>DOWNLOADS</Text>
              
              <List.Item
                title="Download on Wi-Fi Only"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Save mobile data by downloading only on Wi-Fi"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Wifi variant="Broken" size={size} color={color} />
                )} />}
                right={() => (
                  loadingStates.wifiOnly ? (
                    <View style={{ marginRight: 8 }}>
                      <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                    </View>
                  ) : (
                    <AnimatedSwitch 
                      value={settings.downloadOnWifi}
                      onValueChange={handleWifiOnlyToggle}
                    />
                  )
                )}
                disabled={loadingStates.wifiOnly}
              />
              
              <List.Item
                title="High Quality Images"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Load higher resolution thumbnails and previews"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Star variant="Broken" size={size} color={color} />
                )} />}
                right={() => (
                  loadingStates.highQuality ? (
                    <View style={{ marginRight: 8 }}>
                      <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                    </View>
                  ) : (
                    <AnimatedSwitch 
                      value={settings.highQualityThumbs}
                      onValueChange={handleHighQualityToggle}
                    />
                  )
                )}
                disabled={loadingStates.highQuality}
              />
              
              <List.Item
                title="Download Location"
                titleStyle={{ fontSize: fontSizes.body }}
                description={settings.downloadLocation === 'gallery' ? 'Save to Gallery (Shiori album)' : 'Save to App\'s Private Folder'}
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Folder variant="Broken" size={size} color={color} />
                )} />}
                onPress={() => updateDialogStates({ downloadLocationVisible: true })}
                right={props => loadingStates.downloadLocation ? 
                  <ActivityIndicator size="small" color={paperTheme.colors.primary} style={{ marginRight: 8}} /> : 
                  <List.Icon {...props} icon="chevron-right" />}
                disabled={loadingStates.downloadLocation}
              />
              
              <List.Item
                title="Auto-download on Favorite"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Automatically download wallpapers when marked as favorite"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Star variant="Broken" size={size} color={color} />
                )} />}
                right={() => (
                  loadingStates.autoDownload ? (
                    <View style={{ marginRight: 8 }}>
                      <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                    </View>
                  ) : (
                    <AnimatedSwitch 
                      value={settings.autoDownloadOnFavorite}
                      onValueChange={handleAutoDownloadToggle}
                    />
                  )
                )}
                disabled={loadingStates.autoDownload}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>SHARING</Text>
              
              <List.Item
                title="Share to PC"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Share wallpapers to your computer"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Share variant="Broken" size={size} color={color} />
                )} />}
                onPress={() => {
                  // This will be implemented later
                  if (Platform.OS === 'android') {
                    ToastAndroid.show('Feature coming soon', ToastAndroid.SHORT);
                  } else {
                    Alert.alert('Coming Soon', 'This feature will be available in a future update');
                  }
                }}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>WALLHAVEN API</Text>
              
              <List.Item
                title="API Key"
                titleStyle={{ fontSize: fontSizes.body }}
                description={authState.hasApiKey ? 'API key is set and active' : 'No API key set'}
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Key variant="Broken" size={size} color={color} />
                )} />}
                onPress={() => updateAuthState({ wallhavenAuthVisible: true })}
                right={() => authState.hasApiKey ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      onPress={() => {
                        // Open manual key dialog to change key
                        setManualKeyDialogVisible(true);
                      }}
                      style={{ margin: 0 }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => {
                        // Confirm before removing API key
                        Alert.alert(
                          'Remove API Key?',
                          'This will remove your Wallhaven API key and disable NSFW content.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Remove', 
                              style: 'destructive',
                              onPress: handleRemoveApiKey 
                            }
                          ]
                        );
                      }}
                      style={{ margin: 0 }}
                    />
                    <Star variant="Broken" size={24} color={paperTheme.colors.primary} style={{ marginLeft: 4, marginRight: 8 }} />
                  </View>
                ) : null}
              />
              
              <List.Item
                title="Show NSFW Content"
                titleStyle={{ fontSize: fontSizes.body }}
                description={authState.hasApiKey ? "Enable to show NSFW and sketchy content (requires API key)" : "API key required to view NSFW and sketchy content"}
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Eye variant="Broken" size={size} color={color} />
                )} />}
                right={() => (
                  loadingStates.nsfw ? (
                    <View style={{ marginRight: 8 }}>
                      <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                    </View>
                  ) : (
                    <AnimatedSwitch 
                      value={settings.showNsfwContent}
                      onValueChange={handleNsfwToggle}
                      disabled={!authState.hasApiKey}
                    />
                  )
                )}
                disabled={loadingStates.nsfw || !authState.hasApiKey}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>STORAGE</Text>
              
              <List.Item
                title="Clear Cache"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Free up space by clearing cached images"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Trash variant="Broken" size={size} color={color} />
                )} />}
                onPress={clearCache}
                right={() => loadingStates.cache ? (
                  <View style={{ marginRight: 8 }}>
                    <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                  </View>
                ) : null}
                disabled={loadingStates.cache}
              />
              
              <List.Item
                title="Clear Favorites"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Remove all your favorite wallpapers"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Trash variant="Broken" size={size} color={color} />
                )} />}
                onPress={clearFavorites}
                right={() => loadingStates.favorites ? (
                  <View style={{ marginRight: 8 }}>
                    <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                  </View>
                ) : null}
                disabled={loadingStates.favorites}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={[styles.sectionTitle, { fontSize: fontSizes.caption }]}>ABOUT</Text>
              
              <List.Item
                title="About Shiori"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Version 1.0.0"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <InfoCircle variant="Broken" size={size} color={color} />
                )} />}
                onPress={showAbout}
              />
              
              <List.Item
                title="Rate the App"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Enjoying Shiori? Let us know!"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Star variant="Broken" size={size} color={color} />
                )} />}
              />
              
              <List.Item
                title="Contact Us"
                titleStyle={{ fontSize: fontSizes.body }}
                description="Send feedback or report issues"
                descriptionStyle={{ fontSize: fontSizes.caption }}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <Message variant="Broken" size={size} color={color} />
                )} />}
              />
            </Card.Content>
          </Card>
        </ScrollView>
        
        <Portal>
          <Dialog visible={authState.wallhavenAuthVisible} onDismiss={() => updateAuthState({ wallhavenAuthVisible: false })}>
            <Dialog.Title style={{ fontSize: fontSizes.h3 }}>Connect to Wallhaven</Dialog.Title>
            <Dialog.Content>
              {authState.loading ? (
                <View style={{ height: 120, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                  <Text style={{ marginTop: 16, fontSize: fontSizes.body }}>Processing login...</Text>
                </View>
              ) : (
                <>
                  <Text style={{ marginBottom: 20, fontSize: fontSizes.body }}>
                    You have two options to connect with your Wallhaven account:
                  </Text>
                  
                  <Button 
                    mode="contained" 
                    icon={({size, color}) => (
                      <ArrowRight2 variant="Broken" size={18} color={color} />
                    )}
                    onPress={openWallhavenWebsite}
                    style={{ marginBottom: 12 }}
                    labelStyle={{ fontSize: fontSizes.body }}
                  >
                    Open Wallhaven Website
                  </Button>
                  
                  <Button 
                    mode="outlined"
                    icon={({size, color}) => (
                      <Key variant="Broken" size={18} color={color} />
                    )}
                    onPress={showManualKeyDialog}
                    labelStyle={{ fontSize: fontSizes.body }}
                  >
                    Enter API Key Manually
                  </Button>
                  
                  <Text style={{ marginTop: 20, opacity: 0.7, fontSize: fontSizes.caption }}>
                    1. Sign in on the Wallhaven website{'\n'}
                    2. Go to your Settings → Account{'\n'}
                    3. Copy your API Key{'\n'}
                    4. Return here and enter it manually
                  </Text>
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => updateAuthState({ wallhavenAuthVisible: false })} labelStyle={{ fontSize: fontSizes.body }}>Close</Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog visible={manualKeyDialogVisible} onDismiss={hideManualKeyDialog}>
            <Dialog.Title style={{ fontSize: fontSizes.h3 }}>Enter API Key</Dialog.Title>
            <Dialog.Content>
              <Text style={{ marginBottom: 16, fontSize: fontSizes.body }}>
                Please enter your Wallhaven API key. You can find this in your Wallhaven account settings at wallhaven.cc.
              </Text>
              <TextInput
                label="API Key"
                value={inputApiKey}
                onChangeText={setInputApiKey}
                mode="outlined"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect={false}
                style={{ fontSize: fontSizes.body }}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={hideManualKeyDialog} labelStyle={{ fontSize: fontSizes.body }}>Cancel</Button>
              <Button onPress={handleManualApiKeySave} labelStyle={{ fontSize: fontSizes.body }}>Save</Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog visible={dialogStates.fontSizeVisible} onDismiss={() => updateDialogStates({ fontSizeVisible: false })}>
            <Dialog.Title style={{ fontSize: fontSizes.h3 }}>Font Size</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group onValueChange={handleFontSizeChange} value={settings.fontSize}>
                <View style={[styles.fontSizeOption, { marginBottom: 16, alignItems: 'center', height: 48 }]}>
                  <RadioButton.Item 
                    label="Small" 
                    value="small" 
                    position="leading"
                    style={[styles.radioItem, { height: 48 }]} 
                    labelStyle={{ fontSize: fontSizes.bodySmall }}
                  />
                  <Text style={[styles.fontSizeExample, { fontSize: fontSizes.bodySmall }]}>Aa</Text>
                </View>
                <View style={[styles.fontSizeOption, { marginBottom: 16, alignItems: 'center', height: 48 }]}>
                  <RadioButton.Item 
                    label="Medium" 
                    value="medium" 
                    position="leading"
                    style={[styles.radioItem, { height: 48 }]}
                    labelStyle={{ fontSize: fontSizes.body }}
                  />
                  <Text style={[styles.fontSizeExample, { fontSize: fontSizes.body }]}>Aa</Text>
                </View>
                <View style={[styles.fontSizeOption, { marginBottom: 20, alignItems: 'center', height: 48 }]}>
                  <RadioButton.Item 
                    label="Large" 
                    value="large" 
                    position="leading"
                    style={[styles.radioItem, { height: 48 }]}
                    labelStyle={{ fontSize: fontSizes.h4 }}
                  />
                  <Text style={[styles.fontSizeExample, { fontSize: fontSizes.h3 }]}>Aa</Text>
                </View>
              </RadioButton.Group>
              <Text variant="bodySmall" style={[styles.apiKeyHelp, { marginTop: 8, paddingHorizontal: 8 }]}>
                Font size changes apply immediately throughout the app.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => updateDialogStates({ fontSizeVisible: false })} labelStyle={{ fontSize: fontSizes.body }}>Cancel</Button>
              <Button onPress={() => handleFontSizeChange(settings.fontSize)} labelStyle={{ fontSize: fontSizes.body }}>Apply</Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Download Location Dialog */}
          <Dialog visible={dialogStates.downloadLocationVisible} onDismiss={() => updateDialogStates({ downloadLocationVisible: false })}> 
            <Dialog.Title style={{ fontSize: fontSizes.h3 }}>Download Location</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group onValueChange={handleDownloadLocationChange} value={settings.downloadLocation}>
                <RadioButton.Item 
                  label="Gallery (Recommended)"
                  value="gallery"
                  position="leading"
                  style={styles.radioItem}
                  labelStyle={{ fontSize: fontSizes.body }}
                />
                <Text style={[styles.radioDescription, { fontSize: fontSizes.caption }]}>Saves wallpapers to your device's gallery in a 'Shiori' album.</Text>
                
                <RadioButton.Item 
                  label="App's Private Folder"
                  value="private"
                  position="leading"
                  style={styles.radioItem}
                  labelStyle={{ fontSize: fontSizes.body }}
                />
                <Text style={[styles.radioDescription, { fontSize: fontSizes.caption }]}>Saves wallpapers inside the app's storage. Files may not be easily accessible outside the app.</Text>
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => updateDialogStates({ downloadLocationVisible: false })} labelStyle={{ fontSize: fontSizes.body }}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Theme loading overlay */}
          {loadingStates.theme && (
            <View style={styles.loadingOverlay}>
              <Surface style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={[styles.loadingText, { fontSize: fontSizes.body }]}>Changing theme...</Text>
              </Surface>
            </View>
          )}
          
          {/* Font size loading overlay */}
          {loadingStates.fontSize && (
            <View style={styles.loadingOverlay}>
              <Surface style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={[styles.loadingText, { fontSize: fontSizes.body }]}>Applying font size...</Text>
              </Surface>
            </View>
          )}
          
          <Dialog
            visible={clearFavoritesDialogVisible}
            onDismiss={() => setClearFavoritesDialogVisible(false)}
          >
            <Dialog.Title>Clear Favorites</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Are you sure you want to remove all your favorite wallpapers? This action cannot be undone.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClearFavoritesDialogVisible(false)}>Cancel</Button>
              <Button
                onPress={async () => {
                  try {
                    updateLoadingStates({ favorites: true });
                    await AsyncStorage.removeItem('favorites');
                    if (Platform.OS === 'android') {
                      ToastAndroid.show('Favorites cleared successfully', ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Success', 'Favorites cleared successfully');
                    }
                  } catch (error) {
                    console.error('Failed to clear favorites:', error);
                    if (Platform.OS === 'android') {
                      ToastAndroid.show('Failed to clear favorites', ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Error', 'Failed to clear favorites');
                    }
                  } finally {
                    updateLoadingStates({ favorites: false });
                    setClearFavoritesDialogVisible(false);
                  }
                }}
                textColor={paperTheme.colors.error}
              >
                Clear
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog
            visible={clearCacheDialogVisible}
            onDismiss={() => setClearCacheDialogVisible(false)}
          >
            <Dialog.Title>Clear Cache</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Are you sure you want to clear all cached wallpapers? This will free up storage space.</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setClearCacheDialogVisible(false)}>Cancel</Button>
              <Button
                onPress={async () => {
                  try {
                    updateLoadingStates({ cache: true });
                    const cacheDir = FileSystem.cacheDirectory;
                    if (cacheDir) {
                      await FileSystem.deleteAsync(cacheDir, { idempotent: true });
                      await FileSystem.makeDirectoryAsync(cacheDir);
                    }
                    if (Platform.OS === 'android') {
                      ToastAndroid.show('Cache cleared successfully', ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Success', 'Cache cleared successfully');
                    }
                  } catch (error) {
                    console.error('Failed to clear cache:', error);
                    if (Platform.OS === 'android') {
                      ToastAndroid.show('Failed to clear cache', ToastAndroid.SHORT);
                    } else {
                      Alert.alert('Error', 'Failed to clear cache');
                    }
                  } finally {
                    updateLoadingStates({ cache: false });
                    setClearCacheDialogVisible(false);
                  }
                }}
                textColor={paperTheme.colors.error}
              >
                Clear
              </Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog
            visible={aboutDialogVisible}
            onDismiss={() => setAboutDialogVisible(false)}
          >
            <Dialog.Title>About Shiori</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Version 1.0.0</Text>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                A beautiful wallpaper browser app using the Wallhaven API.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setAboutDialogVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog
            visible={contactDialogVisible}
            onDismiss={() => setContactDialogVisible(false)}
          >
            <Dialog.Title>Contact Us</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Have feedback or found an issue?</Text>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                We'd love to hear from you! Please send your feedback or report issues to:
              </Text>
              <Text variant="bodyMedium" style={{ marginTop: 8, color: paperTheme.colors.primary }}>
                support@shiori.app
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setContactDialogVisible(false)}>Close</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userSubtitle: {
    opacity: 0.6,
    marginTop: 2,
  },
  signInButton: {
    borderRadius: 8,
  },
  settingsSection: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.7,
    letterSpacing: 0.15,
    fontFamily: 'Nunito-Regular',
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 24,
  },
  themeOption: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectedTheme: {
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
  },
  themePreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  themeText: {
    fontFamily: 'Nunito-Regular',
  },
  apiKeyInput: {
    marginBottom: 8,
  },
  apiKeyHelp: {
    opacity: 0.6,
  },
  apiKeyLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 8,
    borderRadius: 8,
  },
  apiKeyLoadingText: {
    marginLeft: 12,
    fontFamily: 'Nunito-Medium',
  },
  fontSizeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  radioItem: {
    paddingVertical: 4,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  fontSizeExample: {
    fontFamily: 'Nunito-Bold',
    opacity: 0.8,
    width: 40,
    textAlign: 'center',
    alignSelf: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContainer: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minWidth: 200,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
  webViewDialog: {
    maxHeight: '80%',
  },
  webView: {
    width: '100%',
    height: 500,
  },
  radioDescription: {
    paddingLeft: 48, // Align with radio button text
    paddingRight: 16,
    marginBottom: 16,
    opacity: 0.7,
  }
}); 