import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants for version tracking - must match _layout.tsx
const ONBOARDING_VERSION_KEY = 'onboardingCompletedForVersion';

export default function ResetOnboardingScreen() {
  const router = useRouter();

  const resetOnboarding = async () => {
    try {
      console.log('Resetting onboarding status...');
      await AsyncStorage.removeItem(ONBOARDING_VERSION_KEY);
      console.log('Onboarding status reset successfully');
      Alert.alert(
        'Success',
        'Onboarding status has been reset. Please restart the app to see the onboarding screen.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    } catch (error) {
      console.error('Failed to reset onboarding status:', error);
      Alert.alert('Error', 'Failed to reset onboarding status');
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const status = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
      Alert.alert('Onboarding Status', `Current value: ${status || 'Not set'}`);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      Alert.alert('Error', 'Failed to check onboarding status');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Reset Onboarding' }} />
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>Onboarding Test</Text>
        <Text variant="bodyMedium" style={styles.description}>
          Use these buttons to test the onboarding functionality.
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={checkOnboardingStatus}
            style={styles.button}
          >
            Check Onboarding Status
          </Button>
          
          <Button 
            mode="contained" 
            onPress={resetOnboarding}
            style={[styles.button, styles.resetButton]}
          >
            Reset Onboarding
          </Button>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: '#d32f2f',
  },
});