import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { List, Text, Divider, Avatar, Button, IconButton, Surface, useTheme, Dialog, Portal, TextInput, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { useThemeContext } from '../../contexts/ThemeContext';
import { wallhavenAPI } from '../services/wallhaven';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const { theme, setTheme, isDark, isAmoled } = useThemeContext();
  const paperTheme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);
  const [wallhavenApiKey, setWallhavenApiKeyState] = useState('');
  const [highQualityThumbs, setHighQualityThumbs] = useState(false);
  const [autoplayAnimated, setAutoplayAnimated] = useState(true);
  const [showNsfwContent, setShowNsfwContent] = useState(false);
  const [apiKeyDialogVisible, setApiKeyDialogVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'amoled') => {
    try {
      await setTheme(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const handleApiKeySubmit = async () => {
    setIsLoading(true);
    try {
      // Set the API key
      wallhavenAPI.setApiKey(wallhavenApiKey);
      
      // Test the API key by making a request to user settings
      // If it succeeds, the key is valid
      try {
        const settings = await wallhavenAPI.getUserSettings();
        await AsyncStorage.setItem('wallhavenApiKey', wallhavenApiKey);
        setApiKeyDialogVisible(false);
        Alert.alert('Success', 'API key has been saved successfully.');
      } catch (apiError) {
        // If we get an unauthorized error, the key is invalid
        Alert.alert('Invalid API Key', 'Please check your API key and try again.');
      }
    } catch (error) {
      console.error('API key validation failed:', error);
      Alert.alert('Error', 'Failed to validate API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedKey = await AsyncStorage.getItem('wallhavenApiKey');
        if (savedKey) {
          setWallhavenApiKeyState(savedKey);
          // Also set the key on the wallhavenAPI instance
          wallhavenAPI.setApiKey(savedKey);
        }
        
        // Load NSFW setting
        const nsfwSetting = await AsyncStorage.getItem('showNsfwContent');
        if (nsfwSetting) {
          setShowNsfwContent(nsfwSetting === 'true');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);
  
  // Save NSFW setting when it changes
  useEffect(() => {
    const saveNsfwSetting = async () => {
      try {
        await AsyncStorage.setItem('showNsfwContent', showNsfwContent ? 'true' : 'false');
      } catch (error) {
        console.error('Failed to save NSFW setting:', error);
      }
    };
    saveNsfwSetting();
  }, [showNsfwContent]);

  const clearCache = () => {
    Alert.alert('Cache Cleared', 'All cached images have been cleared');
  };

  const showAbout = () => {
    Alert.alert('Shiori', 'Version 1.0.0\n\nA beautiful wallpaper browser app using the Wallhaven API.');
  };

  return (
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
                <Text variant="titleMedium">Guest User</Text>
                <Text variant="bodySmall" style={styles.userSubtitle}>
                  Create an account to sync favorites across devices
                </Text>
              </View>
            </View>
            <Button mode="contained-tonal" style={styles.signInButton}>
              Sign In
            </Button>
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
                <AnimatedSwitch 
                  value={downloadOnWifi}
                  onValueChange={setDownloadOnWifi}
                />
              )}
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
                  value={autoplayAnimated}
                  onValueChange={setAutoplayAnimated}
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
                <AnimatedSwitch 
                  value={notifications}
                  onValueChange={setNotifications}
                />
              )}
            />
          </Card.Content>
        </Card>
        
        <Card style={styles.settingsSection} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.sectionTitle}>WALLHAVEN API</Text>
            
            <List.Item
              title="API Key"
              description={wallhavenApiKey ? 'API key is set' : 'No API key set'}
              left={props => <List.Icon {...props} icon={({size, color}) => (
                <MaterialIcons name="vpn-key" size={size} color={color} />
              )} />}
              onPress={() => setApiKeyDialogVisible(true)}
            />
            
            <List.Item
              title="Show NSFW Content"
              description="Enable to show NSFW and sketchy content"
              left={props => <List.Icon {...props} icon={({size, color}) => (
                <MaterialIcons name="visibility" size={size} color={color} />
              )} />}
              right={() => (
                <AnimatedSwitch 
                  value={showNsfwContent}
                  onValueChange={setShowNsfwContent}
                />
              )}
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
        <Dialog visible={apiKeyDialogVisible} onDismiss={() => setApiKeyDialogVisible(false)}>
          <Dialog.Title>Wallhaven API Key</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="API Key"
              value={wallhavenApiKey}
              onChangeText={setWallhavenApiKeyState}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.apiKeyInput}
            />
            <Text variant="bodySmall" style={styles.apiKeyHelp}>
              You can get your API key from your Wallhaven account settings.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setApiKeyDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleApiKeySubmit} 
              disabled={isLoading || !wallhavenApiKey}
            >
              {isLoading ? <ActivityIndicator size={16} color={paperTheme.colors.primary} /> : 'Save'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ThemedView>
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
}); 