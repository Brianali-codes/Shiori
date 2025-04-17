import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, Platform, Alert, Linking } from 'react-native';
import { Button, Text, TextInput, useTheme, Divider, ActivityIndicator } from 'react-native-paper';
import { DeviceMessage, Message, Document, InfoCircle, Copy } from 'iconsax-react-nativejs';
import * as ExpoClipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemeContext } from '@/contexts/ThemeContext';
import { FontSizes } from '@/constants/FontSizes';

const EMAIL_ADDRESS = 'brianali427@gmail.com';
const GITHUB_ISSUES = 'https://github.com/brianali-codes/shiori/issues';
const MAX_DESCRIPTION_LENGTH = 1000;

export default function BugReportScreen() {
  const theme = useTheme();
  const colors = useThemeColors();
  const { isDark, isAmoled } = useThemeContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningGitHub, setIsOpeningGitHub] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleCopyDeviceInfo = async () => {
    const deviceInfoText = `App Version: ${appVersion}\nDevice: ${deviceInfo}`;
    await ExpoClipboard.setStringAsync(deviceInfoText);
    showToast('Device info copied to clipboard');
  };

  const handleOpenGitHub = async () => {
    try {
      setIsOpeningGitHub(true);
      const canOpen = await Linking.canOpenURL(GITHUB_ISSUES);
      if (canOpen) {
        await Linking.openURL(GITHUB_ISSUES);
      }
    } catch (error) {
      showToast('Could not open GitHub issues page');
    } finally {
      setIsOpeningGitHub(false);
    }
  };

  const handleSubmit = () => {
    if (!title || !description) {
      showToast('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        Alert.alert(
          'Thank You',
          'Your bug report has been submitted. We appreciate your feedback!',
          [
            {
              text: 'OK',
              style: 'default',
              onPress: () => {
                setTitle('');
                setDescription('');
                setEmail('');
              }
            }
          ],
          {
            cancelable: true
          }
        );
      }, 2000);
    }, 1500);
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
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text 
              variant="headlineSmall" 
              style={[styles.headerText, { color: colors.text, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 }]}
            >
              Report a Bug
            </Text>
            
            <Text style={[styles.description, { color: colors.text, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
              Found something in Shiori that doesn't work right? Let us know and we'll fix it as soon as possible.
            </Text>
          </View>
          
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <TextInput
              label="Bug Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="Brief description of the issue"
            />
            
            <TextInput
              label="Bug Description *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={6}
              style={[styles.textArea, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="Please describe what happened, what you expected to happen, and steps to reproduce the issue"
            />
            <Text style={[styles.charCount, { color: colors.subtext, fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
              {description.length}/{MAX_DESCRIPTION_LENGTH} characters
            </Text>
            
            <TextInput
              label="Your Email (optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="Your email for follow-up questions"
              keyboardType="email-address"
            />

            {showSuccess ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successText, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
                  Bug Report Submitted!
                </Text>
                <Text style={[styles.successSubtext, { color: colors.text, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
                  Thank you for your feedback
                </Text>
              </View>
            ) : (
              <Button 
                mode="contained" 
                onPress={handleSubmit} 
                style={styles.button}
                loading={isSubmitting}
                disabled={isSubmitting}
                labelStyle={{ fontFamily: 'Nunito-Bold', fontSize: FontSizes.button }}
              >
                Submit Bug Report
              </Button>
            )}
          </View>
          
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.alternateHeader, { color: colors.text, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              Alternative Ways to Report
            </Text>
            
            <View style={styles.contactMethod}>
              <Message
                size={22}
                color={getIconColor()}
                variant="Broken"
              />
              <Text style={[styles.contactText, { color: colors.text, fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
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
              <Button 
                mode="text" 
                onPress={handleOpenGitHub} 
                style={styles.contactButton}
                labelStyle={{ fontFamily: 'Nunito-Medium', fontSize: FontSizes.button }}
                disabled={isOpeningGitHub}
              >
                {isOpeningGitHub ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  'Open an issue on GitHub'
                )}
              </Button>
            </View>
          </View>
          
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.infoHeaderText, { color: colors.text, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
                Device Information
              </Text>
              <Button 
                mode="text" 
                onPress={handleCopyDeviceInfo}
                style={styles.copyButton}
                icon={({ size, color }) => (
                  <Copy size={size} color={color} variant="Broken" />
                )}
                labelStyle={{ fontFamily: 'Nunito-Medium', fontSize: FontSizes.button }}
              >
                Copy
              </Button>
            </View>
            <View style={styles.infoRow}>
              <InfoCircle
                size={16}
                color={colors.subtext}
                variant="Broken"
              />
              <Text style={[styles.infoText, { color: colors.subtext, fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                App Version: {appVersion}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <DeviceMessage
                size={16}
                color={colors.subtext}
                variant="Broken"
              />
              <Text style={[styles.infoText, { color: colors.subtext, fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
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
  section: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerText: {
    marginBottom: 8,
    fontSize: FontSizes.h2,
  },
  description: {
    fontSize: FontSizes.body,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    fontSize: FontSizes.input,
  },
  textArea: {
    marginBottom: 8,
    fontSize: FontSizes.input,
  },
  charCount: {
    fontSize: FontSizes.bodySmall,
    textAlign: 'right',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    marginBottom: 8,
  },
  successSubtext: {
    textAlign: 'center',
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
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: FontSizes.h4,
  },
  copyButton: {
    marginLeft: 8,
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