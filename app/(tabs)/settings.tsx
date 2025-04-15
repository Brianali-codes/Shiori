import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { List, Switch, Text, Divider, Avatar, Button, IconButton, Surface, useTheme, Dialog, Portal, TextInput, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from '@/components/ThemedComponents';
import { useThemeContext } from '../../contexts/ThemeContext';
import { wallhavenAPI } from '../services/wallhaven';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { theme, setTheme, isDark, isAmoled } = useThemeContext();
  const paperTheme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);
  const [wallhavenApiKey, setWallhavenApiKeyState] = useState('');
  const [highQualityThumbs, setHighQualityThumbs] = useState(false);
  const [autoplayAnimated, setAutoplayAnimated] = useState(true);
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
    const loadApiKey = async () => {
      try {
        const savedKey = await AsyncStorage.getItem('wallhavenApiKey');
        if (savedKey) {
          setWallhavenApiKeyState(savedKey);
          // Also set the key on the wallhavenAPI instance
          wallhavenAPI.setApiKey(savedKey);
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
      }
    };
    loadApiKey();
  }, []);

  // Store the API key immediately
  useEffect(() => {
    const storeApiKey = async () => {
      try {
        // Store the provided API key
        const apiKey = 'S9eGuYOS7MOFjXfV91Up30hozbk5kpQR';
        await AsyncStorage.setItem('wallhavenApiKey', apiKey);
        setWallhavenApiKeyState(apiKey);
        wallhavenAPI.setApiKey(apiKey);
        console.log("API key stored successfully");
      } catch (error) {
        console.error('Failed to store API key:', error);
      }
    };
    storeApiKey();
  }, []);

  const clearCache = () => {
    Alert.alert('Cache Cleared', 'All cached images have been cleared');
  };

  const showAbout = () => {
    Alert.alert('Fresco Wallpaper', 'Version 1.0.0\n\nA beautiful wallpaper browser app using the Wallhaven API.');
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
                <Switch
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
                <Switch
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
                <Switch
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
              title="About Fresco Wallpaper"
              description="Version 1.0.0"
              left={props => <List.Icon {...props} icon={({size, color}) => (
                <MaterialIcons name="info" size={size} color={color} />
              )} />}
              onPress={showAbout}
            />
            
            <List.Item
              title="Rate the App"
              description="Let us know how we're doing"
              left={props => <List.Icon {...props} icon={({size, color}) => (
                <MaterialIcons name="star" size={size} color={color} />
              )} />}
            />
            
            <List.Item
              title="Send Feedback"
              description="Help us improve the app"
              left={props => <List.Icon {...props} icon={({size, color}) => (
                <MaterialIcons name="email" size={size} color={color} />
              )} />}
            />
          </Card.Content>
        </Card>
        
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Powered by Wallhaven API
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            © 2023 Fresco Wallpaper
          </Text>
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={apiKeyDialogVisible} onDismiss={() => setApiKeyDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Enter Wallhaven API Key</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="API Key"
              value={wallhavenApiKey}
              onChangeText={setWallhavenApiKeyState}
              secureTextEntry
              style={styles.textInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setApiKeyDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleApiKeySubmit} loading={isLoading}>
              Save
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
    margin: 16,
    borderRadius: 16,
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
    opacity: 0.7,
    marginTop: 4,
  },
  signInButton: {
    marginTop: 8,
  },
  settingsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    paddingBottom: 8,
    opacity: 0.7,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.7,
    marginBottom: 8,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  themeOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    width: '30%',
  },
  selectedTheme: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  themeText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 14,
  },
  dialogTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 20,
    letterSpacing: 0.15,
  },
  textInput: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
  },
}); 