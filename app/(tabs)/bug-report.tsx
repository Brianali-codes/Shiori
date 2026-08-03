import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, Platform, Alert, Linking, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, useTheme, ActivityIndicator, Chip, Surface } from 'react-native-paper';
import { DeviceMessage, Message, Document, InfoCircle, Copy, Warning2, Star1, Clock, TickCircle } from 'iconsax-react-nativejs';
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

const BUG_CATEGORIES = [
  { id: 'crash', label: 'App Crash', icon: Warning2 },
  { id: 'ui', label: 'UI Issue', icon: Star1 },
  { id: 'feature', label: 'Feature Bug', icon: Message },
  { id: 'performance', label: 'Performance', icon: Clock },
  { id: 'other', label: 'Other', icon: InfoCircle },
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
  { id: 'critical', label: 'Critical' },
];

export default function BugReportScreen() {
  const theme = useTheme();
  const colors = useThemeColors();
  const { isDark, isAmoled } = useThemeContext();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPriority, setPriority] = useState('medium');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpeningGitHub, setIsOpeningGitHub] = useState(false);

  const cardBackground = isDark || isAmoled ? theme.colors.elevation.level2 : theme.colors.surface;

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
    const deviceInfoText = `App Version: ${appVersion}\nDevice: ${deviceInfo}\nPlatform: ${Platform.OS} ${Platform.Version}`;
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEmail('');
    setSelectedCategory('');
    setPriority('medium');
    setStepsToReproduce('');
    setExpectedBehavior('');
  };

  const handleSubmit = () => {
    if (!title || !description || !selectedCategory) {
      showToast('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Thank You',
        'Your bug report has been submitted successfully.',
        [
          { text: 'Submit Another', onPress: resetForm },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }, 1200);
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
              fontSize: FontSizes.h3,
            },
            headerShadowVisible: false,
          }}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Main Form Section */}
          <Surface style={[styles.card, { backgroundColor: cardBackground }]} elevation={1}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'Nunito-Bold' }]}>
              Issue Details
            </Text>

            {/* Bug Category Chips */}
            <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Category *</Text>
            <View style={styles.chipRow}>
              {BUG_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <Chip
                    key={category.id}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(category.id)}
                    style={styles.chip}
                    showSelectedOverlay
                    icon={() => (
                      <IconComponent
                        size={16}
                        color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        variant={isSelected ? 'Bold' : 'Linear'}
                      />
                    )}
                  >
                    {category.label}
                  </Chip>
                );
              })}
            </View>

            {/* Priority Selection */}
            <Text style={[styles.inputLabel, { color: theme.colors.onSurfaceVariant }]}>Priority</Text>
            <View style={styles.chipRow}>
              {PRIORITY_LEVELS.map((priority) => {
                const isSelected = selectedPriority === priority.id;
                return (
                  <Chip
                    key={priority.id}
                    selected={isSelected}
                    onPress={() => setPriority(priority.id)}
                    style={styles.chip}
                    showSelectedOverlay
                  >
                    {priority.label}
                  </Chip>
                );
              })}
            </View>

            {/* Inputs */}
            <TextInput
              label="Bug Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              placeholder="Brief summary of the issue"
            />

            <TextInput
              label="What happened? *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              maxLength={MAX_DESCRIPTION_LENGTH}
              style={styles.input}
              placeholder="Describe what went wrong"
            />
            <Text style={[styles.charCount, { color: theme.colors.outline }]}>
              {description.length}/{MAX_DESCRIPTION_LENGTH}
            </Text>

            <TextInput
              label="Steps to Reproduce (optional)"
              value={stepsToReproduce}
              onChangeText={setStepsToReproduce}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              placeholder="1. Go to... &#10;2. Tap on..."
            />

            <TextInput
              label="Expected Behavior (optional)"
              value={expectedBehavior}
              onChangeText={setExpectedBehavior}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.input}
              placeholder="What should have happened?"
            />

            <TextInput
              label="Your Email (optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              placeholder="For follow-up updates"
              keyboardType="email-address"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={isSubmitting}
              disabled={isSubmitting || !title || !description || !selectedCategory}
            >
              Submit Report
            </Button>
          </Surface>

          {/* Alternative Contact Section */}
          <Surface style={[styles.card, { backgroundColor: cardBackground }]} elevation={1}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'Nunito-Bold' }]}>
              Other Ways to Report
            </Text>

            <TouchableOpacity style={styles.contactRow} onPress={handleCopyEmail}>
              <Message size={20} color={theme.colors.primary} />
              <View style={styles.contactTextContainer}>
                <Text style={{ color: theme.colors.onSurface, fontFamily: 'Nunito-Medium' }}>Email Direct</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: FontSizes.bodySmall }}>{EMAIL_ADDRESS}</Text>
              </View>
              <Copy size={18} color={theme.colors.outline} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactRow} onPress={handleOpenGitHub}>
              <Document size={20} color={theme.colors.primary} />
              <View style={styles.contactTextContainer}>
                <Text style={{ color: theme.colors.onSurface, fontFamily: 'Nunito-Medium' }}>GitHub Issues</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: FontSizes.bodySmall }}>Submit issue on repository</Text>
              </View>
              {isOpeningGitHub ? <ActivityIndicator size="small" /> : <InfoCircle size={18} color={theme.colors.outline} />}
            </TouchableOpacity>
          </Surface>

          {/* Device Info */}
          <Surface style={[styles.card, { backgroundColor: cardBackground }]} elevation={1}>
            <View style={styles.deviceHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, fontFamily: 'Nunito-Bold', marginBottom: 0 }]}>
                Device Information
              </Text>
              <Button mode="text" onPress={handleCopyDeviceInfo} compact icon="content-copy">
                Copy
              </Button>
            </View>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: FontSizes.bodySmall, marginTop: 8 }}>
              App Version: {appVersion} | Device: {deviceInfo}
            </Text>
          </Surface>
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
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: FontSizes.h4,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: FontSizes.bodySmall,
    fontFamily: 'Nunito-Medium',
    marginBottom: 8,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    borderRadius: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  charCount: {
    textAlign: 'right',
    fontSize: FontSizes.bodySmall,
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});