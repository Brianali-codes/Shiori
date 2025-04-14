import React, { useState, useCallback, useEffect } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { List, Switch, Text, Divider, Avatar, Button, IconButton, Surface, useTheme, Dialog, Portal, TextInput } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedView';
import { useThemeContext } from '../../contexts/ThemeContext';
import { wallhavenAPI, setWallhavenApiKey } from '../services/wallhaven';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useThemeContext();
  const paperTheme = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);
  const [wallhavenApiKey, setWallhavenApiKeyState] = useState('');
  const [highQualityThumbs, setHighQualityThumbs] = useState(false);
  const [autoplayAnimated, setAutoplayAnimated] = useState(true);
  const [apiKeyDialogVisible, setApiKeyDialogVisible] = useState(false);

  const saveApiKey = async () => {
    if (wallhavenApiKey.trim()) {
      try {
        // Save API key to storage
        await AsyncStorage.setItem('wallhaven_api_key', wallhavenApiKey);
        // Update API key in the wallhaven service
        const apiInstance = setWallhavenApiKey(wallhavenApiKey);
        // Hide dialog
        setApiKeyDialogVisible(false);
        // Show success message
        Alert.alert('API Key Saved', 'Your Wallhaven API key has been saved');
      } catch (error) {
        console.error('Failed to save API key:', error);
        Alert.alert('Error', 'Failed to save API key');
      }
    } else {
      Alert.alert('Error', 'Please enter a valid API key');
    }
  };

  // Load saved API key when component mounts
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const savedApiKey = await AsyncStorage.getItem('wallhaven_api_key');
        if (savedApiKey) {
          setWallhavenApiKeyState(savedApiKey);
          // Update the API service with the saved key
          setWallhavenApiKey(savedApiKey);
        }
      } catch (error) {
        console.error('Failed to load API key:', error);
      }
    };
    
    loadApiKey();
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
        <Surface style={styles.userCard} elevation={1}>
          <View style={styles.userInfo}>
            <Avatar.Icon 
              icon={() => <IconSymbol name="person.crop.circle.fill" size={30} color={paperTheme.colors.primary} />} 
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
          <Button mode="contained-tonal">
            Sign In
          </Button>
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>APPEARANCE</Text>
          
          <List.Item
            title="Dark Mode"
            description={`Currently using ${theme === 'dark' ? 'dark' : 'light'} theme`}
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="moon.fill" size={size} color={color} />
            )} />}
            right={() => (
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
              />
            )}
          />
          
          <List.Item
            title="High Quality Thumbnails"
            description="Use high quality images (uses more data)"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="photo.fill" size={size} color={color} />
            )} />}
            right={() => (
              <Switch
                value={highQualityThumbs}
                onValueChange={setHighQualityThumbs}
              />
            )}
          />
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>DOWNLOADS</Text>
          
          <List.Item
            title="Download on Wi-Fi Only"
            description="Save mobile data by downloading only on Wi-Fi"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="wifi" size={size} color={color} />
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
              <IconSymbol name="folder.fill" size={size} color={color} />
            )} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
          
          <List.Item
            title="Auto-play Animated Wallpapers"
            description="Play animated wallpapers automatically"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="play.fill" size={size} color={color} />
            )} />}
            right={() => (
              <Switch
                value={autoplayAnimated}
                onValueChange={setAutoplayAnimated}
              />
            )}
          />
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>NOTIFICATIONS</Text>
          
          <List.Item
            title="Enable Notifications"
            description="Get notified about new wallpapers"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="bell.fill" size={size} color={color} />
            )} />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>WALLHAVEN API</Text>
          
          <List.Item
            title="API Key"
            description="Enter your Wallhaven API key for NSFW content"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="key.fill" size={size} color={color} />
            )} />}
            onPress={() => {
              setApiKeyDialogVisible(true);
            }}
          />
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>STORAGE</Text>
          
          <List.Item
            title="Clear Cache"
            description="Free up space by clearing cached images"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="trash.fill" size={size} color={color} />
            )} />}
            onPress={clearCache}
          />
        </Surface>
        
        <Surface style={styles.settingsSection} elevation={0}>
          <Text variant="titleSmall" style={styles.sectionTitle}>ABOUT</Text>
          
          <List.Item
            title="About Fresco Wallpaper"
            description="Version 1.0.0"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="info.circle.fill" size={size} color={color} />
            )} />}
            onPress={showAbout}
          />
          
          <List.Item
            title="Rate the App"
            description="Let us know how we're doing"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="star.fill" size={size} color={color} />
            )} />}
          />
          
          <List.Item
            title="Send Feedback"
            description="Help us improve the app"
            left={props => <List.Icon {...props} icon={({size, color}) => (
              <IconSymbol name="envelope.fill" size={size} color={color} />
            )} />}
          />
        </Surface>
        
        <View style={styles.footer}>
          <Text variant="bodySmall" style={styles.footerText}>
            Powered by Wallhaven API
          </Text>
          <Text variant="bodySmall" style={styles.footerText}>
            © 2023 Fresco Wallpaper
          </Text>
        </View>
      </ScrollView>

      <Dialog
        visible={apiKeyDialogVisible}
        onDismiss={() => setApiKeyDialogVisible(false)}
      >
        <Dialog.Title>Enter Wallhaven API Key</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="API Key"
            value={wallhavenApiKey}
            onChangeText={setWallhavenApiKeyState}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={saveApiKey}>Save</Button>
          <Button onPress={() => setApiKeyDialogVisible(false)}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    margin: 16,
    padding: 16,
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
  settingsSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  }
}); 