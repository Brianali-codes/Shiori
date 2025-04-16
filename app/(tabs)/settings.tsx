import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Animated, Easing, Platform, Linking } from 'react-native';
import { List, Text, Divider, Avatar, Button, IconButton, Surface, useTheme, Dialog, Portal, TextInput, ActivityIndicator, Card, RadioButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { useThemeContext } from '../../contexts/ThemeContext';
import { wallhavenAPI, setHighQualityMode } from '../services/wallhaven';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';

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
  
  // Authentication states
  const [authState, setAuthState] = useState({
    wallhavenAuthVisible: false,
    loading: false,
    username: null as string | null,
    apiKey: ''
  });

  // App settings states
  const [settings, setSettings] = useState({
    notifications: true,
    downloadOnWifi: true,
    highQualityThumbs: false,
    autoplayAnimated: true,
    showNsfwContent: false,
    fontSize: 'small' as 'small' | 'medium' | 'large'
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
    apiKey: false
  });

  // Dialog states
  const [dialogStates, setDialogStates] = useState({
    fontSizeVisible: false
  });

  const webViewRef = useRef<WebView>(null);

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
          // Set the API key but don't update state to avoid showing in UI
          wallhavenAPI.setApiKey(savedKey);
        }

        // Load username
        const savedUsername = await AsyncStorage.getItem('wallhavenUsername');
        if (savedUsername) {
          updateAuthState({ username: savedUsername });
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
        loading: false
      });
      wallhavenAPI.setApiKey('');
      
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
              loading: false
            });
          } else {
            // No username but key is valid
            updateAuthState({
              apiKey: newApiKey,
              wallhavenAuthVisible: false,
              loading: false
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
    if (value && !authState.apiKey) {
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
      
      // Add a small delay to show the loading indicator
      setTimeout(() => {
        updateLoadingStates({ nsfw: false });
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

  // Handle autoplay animated toggle
  const handleAutoplayToggle = async (value: boolean) => {
    updateSettings({ autoplayAnimated: value });
    
    try {
      await AsyncStorage.setItem('autoplayAnimated', value ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save autoplay setting:', error);
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

  const clearCache = () => {
    updateLoadingStates({ cache: true });
    
    // Simulate cache clearing process
    setTimeout(() => {
      updateLoadingStates({ cache: false });
      Alert.alert('Cache Cleared', 'All cached images have been cleared');
    }, 1500);
  };

  const showAbout = () => {
    Alert.alert('Shiori', 'Version 1.0.0\n\nA beautiful wallpaper browser app using the Wallhaven API.');
  };

  // Handle font size change
  const handleFontSizeChange = async (value: string) => {
    if (value === 'small' || value === 'medium' || value === 'large') {
      updateSettings({ fontSize: value as 'small' | 'medium' | 'large' });
      
      try {
        updateLoadingStates({ fontSize: true });
        
        // Save the font size preference
        await AsyncStorage.setItem('fontSizeOption', value);
        
        // Show loading indicator for a moment to improve UX
        setTimeout(() => {
          updateLoadingStates({ fontSize: false });
          
          // Show dialog about app restart
          Alert.alert(
            'Font Size Changed',
            'Please restart the app for the new font size to take full effect.',
            [{ text: 'OK' }]
          );
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
                  icon={() => <MaterialIcons name="account-circle" size={30} color={paperTheme.colors.primary} />} 
                  size={60} 
                  style={{ backgroundColor: paperTheme.colors.surfaceVariant }}
                />
                <View style={styles.userDetails}>
                  <Text variant="titleMedium">{authState.username || 'Guest User'}</Text>
                  <Text variant="bodySmall" style={styles.userSubtitle}>
                    {authState.username ? 'Wallhaven Account Connected' : 'Sign in with your Wallhaven account'}
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
                >
                  Sign In with Wallhaven
                </Button>
              )}
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>APPEARANCE</Text>
              
              <View style={styles.themeOptions}>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'light' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('light')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#FFFFFF' }]} />
                  <ThemedText style={styles.themeText}>Light</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'dark' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('dark')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#151718' }]} />
                  <ThemedText style={styles.themeText}>Dark</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'amoled' && styles.selectedTheme]}
                  onPress={() => handleThemeChange('amoled')}
                >
                  <View style={[styles.themePreview, { backgroundColor: '#000000' }]} />
                  <ThemedText style={styles.themeText}>AMOLED</ThemedText>
                </TouchableOpacity>
              </View>
              
              <List.Item
                title="Font Size"
                description={`${settings.fontSize.charAt(0).toUpperCase() + settings.fontSize.slice(1)} text scaling`}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="format-size" size={size} color={color} />
                )} />}
                onPress={() => updateDialogStates({ fontSizeVisible: true })}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>DOWNLOADS</Text>
              
              <List.Item
                title="Download on Wi-Fi Only"
                description="Save mobile data by downloading only on Wi-Fi"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="wifi" size={size} color={color} />
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
                description="Load higher resolution thumbnails and previews"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="high-quality" size={size} color={color} />
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
                description="Choose where to save wallpapers"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="folder" size={size} color={color} />
                )} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              
              <List.Item
                title="Auto-play Animated Wallpapers"
                description="Play animated wallpapers automatically"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="play-circle" size={size} color={color} />
                )} />}
                right={() => (
                  <AnimatedSwitch 
                    value={settings.autoplayAnimated}
                    onValueChange={handleAutoplayToggle}
                  />
                )}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>NOTIFICATIONS</Text>
              
              <List.Item
                title="Enable Notifications"
                description="Get notified about new wallpapers"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="notifications" size={size} color={color} />
                )} />}
                right={() => (
                  loadingStates.notifications ? (
                    <View style={{ marginRight: 8 }}>
                      <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                    </View>
                  ) : (
                    <AnimatedSwitch 
                      value={settings.notifications}
                      onValueChange={handleNotificationsToggle}
                    />
                  )
                )}
                disabled={loadingStates.notifications}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>WALLHAVEN API</Text>
              
              <List.Item
                title="API Key"
                description={authState.apiKey ? 'API key is set' : 'No API key set'}
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="vpn-key" size={size} color={color} />
                )} />}
                onPress={() => updateAuthState({ wallhavenAuthVisible: true })}
              />
              
              <List.Item
                title="Show NSFW Content"
                description="Enable to show NSFW and sketchy content"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="visibility" size={size} color={color} />
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
                    />
                  )
                )}
                disabled={loadingStates.nsfw}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>STORAGE</Text>
              
              <List.Item
                title="Clear Cache"
                description="Free up space by clearing cached images"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="delete" size={size} color={color} />
                )} />}
                onPress={clearCache}
                right={() => loadingStates.cache ? (
                  <View style={{ marginRight: 8 }}>
                    <ActivityIndicator size={24} color={paperTheme.colors.primary} />
                  </View>
                ) : null}
                disabled={loadingStates.cache}
              />
            </Card.Content>
          </Card>
          
          <Card style={styles.settingsSection} mode="elevated">
            <Card.Content>
              <Text variant="titleSmall" style={styles.sectionTitle}>ABOUT</Text>
              
              <List.Item
                title="About Shiori"
                description="Version 1.0.0"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="info" size={size} color={color} />
                )} />}
                onPress={showAbout}
              />
              
              <List.Item
                title="Rate the App"
                description="Enjoying Shiori? Let us know!"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="star" size={size} color={color} />
                )} />}
              />
              
              <List.Item
                title="Contact Us"
                description="Send feedback or report issues"
                left={props => <List.Icon {...props} icon={({size, color}) => (
                  <MaterialIcons name="email" size={size} color={color} />
                )} />}
              />
            </Card.Content>
          </Card>
        </ScrollView>
        
        <Portal>
          <Dialog visible={authState.wallhavenAuthVisible} onDismiss={() => updateAuthState({ wallhavenAuthVisible: false })} style={styles.webViewDialog}>
            <Dialog.Title>Sign in to Wallhaven</Dialog.Title>
            <Dialog.Content>
              {authState.loading ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                  <Text style={{ marginTop: 16 }}>Processing login...</Text>
                </View>
              ) : (
                <WebView
                  ref={webViewRef}
                  source={{ uri: 'https://wallhaven.cc/login' }}
                  style={styles.webView}
                  onNavigationStateChange={handleWebViewNavigationStateChange}
                  onMessage={handleWebViewMessage}
                  incognito={true}
                  sharedCookiesEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                    </View>
                  )}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error: ', nativeEvent);
                  }}
                />
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => updateAuthState({ wallhavenAuthVisible: false })}>Cancel</Button>
            </Dialog.Actions>
          </Dialog>
          
          <Dialog visible={dialogStates.fontSizeVisible} onDismiss={() => updateDialogStates({ fontSizeVisible: false })}>
            <Dialog.Title>Font Size</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group onValueChange={handleFontSizeChange} value={settings.fontSize}>
                <View style={styles.fontSizeOption}>
                  <RadioButton.Item 
                    label="Small" 
                    value="small" 
                    position="leading"
                    style={styles.radioItem}
                    labelStyle={{ fontSize: 14 }}
                  />
                  <Text style={styles.fontSizeExample}>Aa</Text>
                </View>
                <View style={styles.fontSizeOption}>
                  <RadioButton.Item 
                    label="Medium" 
                    value="medium" 
                    position="leading"
                    style={styles.radioItem}
                    labelStyle={{ fontSize: 16 }}
                  />
                  <Text style={[styles.fontSizeExample, { fontSize: 20 }]}>Aa</Text>
                </View>
                <View style={styles.fontSizeOption}>
                  <RadioButton.Item 
                    label="Large" 
                    value="large" 
                    position="leading"
                    style={styles.radioItem}
                    labelStyle={{ fontSize: 18 }}
                  />
                  <Text style={[styles.fontSizeExample, { fontSize: 24 }]}>Aa</Text>
                </View>
              </RadioButton.Group>
              <Text variant="bodySmall" style={styles.apiKeyHelp}>
                Changes will take effect after restarting the app.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => updateDialogStates({ fontSizeVisible: false })}>Cancel</Button>
              <Button onPress={() => {
                handleFontSizeChange(settings.fontSize);
                updateDialogStates({ fontSizeVisible: false });
              }}>Apply</Button>
            </Dialog.Actions>
          </Dialog>
          
          {/* Theme loading overlay */}
          {loadingStates.theme && (
            <View style={styles.loadingOverlay}>
              <Surface style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={styles.loadingText}>Changing theme...</Text>
              </Surface>
            </View>
          )}
          
          {/* Font size loading overlay */}
          {loadingStates.fontSize && (
            <View style={styles.loadingOverlay}>
              <Surface style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={styles.loadingText}>Applying font size...</Text>
              </Surface>
            </View>
          )}
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
    fontSize: 14,
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
    fontSize: 14,
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
  },
  fontSizeExample: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    opacity: 0.8,
    width: 40,
    textAlign: 'center',
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
    fontSize: 16,
    textAlign: 'center',
  },
  webViewDialog: {
    maxHeight: '80%',
  },
  webView: {
    width: '100%',
    height: 500,
  },
}); 