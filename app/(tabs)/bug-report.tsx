import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, Platform, Alert } from 'react-native';
import { Button, Text, TextInput, useTheme, Divider } from 'react-native-paper';
import { DeviceMessage, Message, Document, InfoCircle } from 'iconsax-react-nativejs';
import * as ExpoClipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemeContext } from '@/contexts/ThemeContext';
import { FontSizes } from '@/constants/FontSizes';

const EMAIL_ADDRESS = 'brianali427@gmail.com';
const GITHUB_ISSUES = 'https://github.com/brianali-codes/shiori/issues';

export default function BugReportScreen() {
  const theme = useTheme();
  const colors = useThemeColors();
  const { isDark, isAmoled } = useThemeContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');

  // Get icon color based on theme
  const getIconColor = () => {
    return isDark || isAmoled ? '#FFFFFF' : theme.colors.secondary;
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Info', message);
    }
  };

  const handleCopyEmail = async () => {
    await ExpoClipboard.setStringAsync(EMAIL_ADDRESS);
    showToast('Email address copied to clipboard');
  };

  const handleSubmit = () => {
    if (!title || !description) {
      showToast('Please fill out all required fields');
      return;
    }

    // Add your submission logic here
    // For now, just show a success message
    Alert.alert(
      'Thank You',
      'Your bug report has been submitted. We appreciate your feedback!',
      [{ text: 'OK', onPress: () => {
        setTitle('');
        setDescription('');
        setEmail('');
      }}]
    );
  };

  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const deviceInfo = `${Platform.OS} ${Platform.Version}`;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen 
          options={{ 
            title: 'Report a Bug',
            headerTitleStyle: {
              fontFamily: 'Nunito-Bold',
              fontSize: FontSizes.h3
            },
            headerShadowVisible: false
          }} 
        />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text 
            variant="headlineSmall" 
            style={[styles.headerText, { color: colors.text, fontFamily: 'Nunito-Bold' }]}
          >
            Report a Bug
          </Text>
          
          <Text style={[styles.description, { color: colors.text, fontFamily: 'Nunito-Regular' }]}>
            Found something in Shiori that doesn't work right? Let us know and we'll fix it as soon as possible.
          </Text>
          
          <View style={styles.formContainer}>
            <TextInput
              label="Bug Title"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular' }]}
              placeholder="Brief description of the issue"
            />
            
            <TextInput
              label="Bug Description"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.textArea, { fontFamily: 'Nunito-Regular' }]}
              placeholder="Please describe what happened, what you expected to happen, and steps to reproduce the issue"
            />
            
            <TextInput
              label="Your Email (optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular' }]}
              placeholder="Your email for follow-up questions"
              keyboardType="email-address"
            />

            <Button 
              mode="outlined" 
              onPress={handleSubmit} 
              style={styles.button}
              labelStyle={{ fontFamily: 'Nunito-Bold', fontSize: FontSizes.button }}
            >
              Submit Bug Report
            </Button>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.alternateContainer}>
            <Text style={[styles.alternateHeader, { color: colors.text, fontFamily: 'Nunito-Bold' }]}>
              Alternative Ways to Report
            </Text>
            
            <View style={styles.contactMethod}>
              <Message
                size={22}
                color={getIconColor()}
                variant="Broken"
              />
              <Text style={[styles.contactText, { color: colors.text, fontFamily: 'Nunito-Regular' }]}>
                Email us directly: 
              </Text>
              <Button 
                mode="text" 
                onPress={handleCopyEmail} 
                style={styles.contactButton}
                labelStyle={{ fontFamily: 'Nunito-Medium', fontSize: FontSizes.button }}
              >
                {EMAIL_ADDRESS}
              </Button>
            </View>
            
            <View style={styles.contactMethod}>
              <Document
                size={22}
                color={getIconColor()}
                variant="Broken"
              />
              <Text style={[styles.contactText, { color: colors.text, fontFamily: 'Nunito-Regular' }]}>
                Open an issue on GitHub
              </Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <InfoCircle
                size={16}
                color={colors.subtext}
                variant="Broken"
              />
              <Text style={[styles.infoText, { color: colors.subtext, fontFamily: 'Nunito-Regular' }]}>
                App Version: {appVersion}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <DeviceMessage
                size={16}
                color={colors.subtext}
                variant="Broken"
              />
              <Text style={[styles.infoText, { color: colors.subtext, fontFamily: 'Nunito-Regular' }]}>
                Device: {deviceInfo}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerText: {
    marginBottom: 8,
    fontSize: FontSizes.h2,
  },
  description: {
    fontSize: FontSizes.body,
    marginBottom: 24,
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
    fontSize: FontSizes.input,
  },
  textArea: {
    marginBottom: 16,
    fontSize: FontSizes.input,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
  divider: {
    marginVertical: 24,
  },
  alternateContainer: {
    marginBottom: 24,
  },
  alternateHeader: {
    fontSize: FontSizes.h4,
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 8,
    fontSize: FontSizes.body,
  },
  contactButton: {
    marginLeft: 4,
  },
  infoContainer: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: FontSizes.bodySmall,
    marginLeft: 8,
  },
}); 