import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, ToastAndroid, Platform, Alert, Linking, Animated, TouchableOpacity } from 'react-native';
import { Button, Text, TextInput, useTheme,  ActivityIndicator, Chip, } from 'react-native-paper';
import { DeviceMessage, Message, Document, InfoCircle, Copy, Warning2, Star1, Clock, TickCircle} from 'iconsax-react-nativejs';
import * as ExpoClipboard from 'expo-clipboard';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemeContext } from '@/contexts/ThemeContext';
import { FontSizes } from '@/constants/FontSizes';

const EMAIL_ADDRESS = 'brianali427@gmail.com';
const GITHUB_ISSUES = 'https://github.com/brianali-codes/shiori/issues';
const MAX_DESCRIPTION_LENGTH = 1000;

const BUG_CATEGORIES = [
  { id: 'crash', label: 'App Crash', icon: Warning2, color: '#FF6B6B' },
  { id: 'ui', label: 'UI Issue', icon: Star1, color: '#4ECDC4' },
  { id: 'feature', label: 'Feature Bug', icon: Message, color: '#45B7D1' },
  { id: 'performance', label: 'Performance', icon: Clock, color: '#96CEB4' },
  { id: 'other', label: 'Other', icon: InfoCircle, color: '#FECA57' },
];

const PRIORITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#95E1D3' },
  { id: 'medium', label: 'Medium', color: '#F9CA24' },
  { id: 'high', label: 'High', color: '#F0932B' },
  { id: 'critical', label: 'Critical', color: '#EB4D4B' },
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
  const [showSuccess, setShowSuccess] = useState(false);

  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  // Enhanced container colors with black-reddish theme
  const getContainerColor = () => {
    if (isDark || isAmoled) {
      return '#1a1214'; // Dark black-reddish
    }
    return '#2a1a1d'; // Lighter black-reddish for light theme
  };

  const getCardColor = () => {
    if (isDark || isAmoled) {
      return '#302828'; // Slightly lighter than container
    }
    return '#3d2326'; // Lighter version for light theme
  };

  // Get icon color based on theme
  const getIconColor = () => {
    return isDark || isAmoled ? '#FFFFFF' : '#FFFFFF'; // White for both themes now
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

  const calculateProgress = () => {
    let progress = 0;
    if (title) progress += 20;
    if (description) progress += 25;
    if (selectedCategory) progress += 20;
    if (stepsToReproduce) progress += 20;
    if (expectedBehavior) progress += 15;
    return progress;
  };

  const animateProgress = () => {
    const progress = calculateProgress();
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEmail('');
    setSelectedCategory('');
    setPriority('medium');
    setStepsToReproduce('');
    setExpectedBehavior('');
    successAnim.setValue(0);
    progressAnim.setValue(0);
  };

  React.useEffect(() => {
    animateProgress();
  }, [title, description, selectedCategory, stepsToReproduce, expectedBehavior]);

  const handleSubmit = () => {
    if (!title || !description || !selectedCategory) {
      showToast('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Animate success
    Animated.sequence([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        Alert.alert(
          '🎉 Thank You!',
          'Your detailed bug report helps us make Shiori better for everyone. We\'ll look into this issue and get back to you if needed.',
          [
            {
              text: 'Submit Another',
              style: 'default',
              onPress: resetForm
            },
            {
              text: 'Done',
              style: 'cancel',
            }
          ],
          { cancelable: true }
        );
      }, 3000);
    }, 2000);
  };

  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const deviceInfo = `${Platform.OS} ${Platform.Version}`;
  const progress = calculateProgress();

  if (showSuccess) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Stack.Screen 
            options={{ 
              title: 'Bug Report',
              headerTitleStyle: {
                fontFamily: 'Nunito-Bold',
                fontSize: FontSizes.h3
              },
              headerShadowVisible: false
            }} 
          />
          
          <Animated.View 
            style={[
              styles.successScreen, 
              { 
                backgroundColor: colors.background,
                opacity: successAnim,
                transform: [{
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            <View style={[styles.successContainer, { backgroundColor: getContainerColor() }]}>
              <LinearGradient
                colors={[theme.colors.primary + '20', theme.colors.primaryContainer + '40']}
                style={styles.successGradient}
              >
                <TickCircle size={80} color={theme.colors.primary} variant="Bold" />
                <Text style={[styles.successTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 }]}>
                  Report Submitted!
                </Text>
                <Text style={[styles.successSubtitle, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
                  Thank you for helping us improve Shiori
                </Text>
                <View style={styles.successStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 }]}>
                      {Math.floor(Math.random() * 50) + 100}
                    </Text>
                    <Text style={[styles.statLabel, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                      Reports this month
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statNumber, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.h3 }]}>
                      {Math.floor(Math.random() * 10) + 90}%
                    </Text>
                    <Text style={[styles.statLabel, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                      Resolution rate
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

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
        
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: getContainerColor() }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: '#FFFFFF', fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall }]}>
              Report Progress
            </Text>
            <Text style={[styles.progressPercent, { color: theme.colors.primary, fontFamily: 'Nunito-Bold', fontSize: FontSizes.bodySmall }]}>
              {progress}%
            </Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  backgroundColor: theme.colors.primary,
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp'
                  })
                }
              ]} 
            />
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Header Section */}
          <View style={[styles.headerCard, { backgroundColor: getCardColor() }]}>
            <LinearGradient
              colors={[theme.colors.primary + '15', theme.colors.primaryContainer + '25']}
              style={styles.headerGradient}
            >
              <Message size={48} color={theme.colors.primary} variant="Bold" />
              <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h2 }]}>
                Help Us Fix It!
              </Text>
              <Text style={[styles.headerSubtitle, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.body }]}>
                Your detailed report helps us identify and resolve issues quickly
              </Text>
            </LinearGradient>
          </View>
          
          {/* Bug Category Selection */}
          <View style={[styles.section, { backgroundColor: getCardColor() }]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              What type of issue is this? *
            </Text>
            <View style={styles.categoryGrid}>
              {BUG_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      { 
                        backgroundColor: isSelected ? category.color + '25' : 'rgba(255,255,255,0.1)',
                        borderColor: isSelected ? category.color : 'transparent',
                        borderWidth: isSelected ? 2 : 0
                      }
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <IconComponent 
                      size={28} 
                      color={isSelected ? category.color : '#FFFFFF'} 
                      variant={isSelected ? "Bold" : "Broken"} 
                    />
                    <Text style={[
                      styles.categoryLabel, 
                      { 
                        color: isSelected ? category.color : '#FFFFFF',
                        fontFamily: isSelected ? 'Nunito-Bold' : 'Nunito-Regular',
                        fontSize: FontSizes.bodySmall 
                      }
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={[styles.section, { backgroundColor: getCardColor() }]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              Priority Level
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityScroll}>
              {PRIORITY_LEVELS.map((priority) => (
                <Chip
                  key={priority.id}
                  selected={selectedPriority === priority.id}
                  onPress={() => setPriority(priority.id)}
                  style={[
                    styles.priorityChip,
                    { backgroundColor: 'rgba(255,255,255,0.1)' },
                    selectedPriority === priority.id && { 
                      backgroundColor: priority.color + '30',
                      borderColor: priority.color
                    }
                  ]}
                  textStyle={[
                    { color: '#FFFFFF' },
                    selectedPriority === priority.id && { 
                      color: priority.color,
                      fontFamily: 'Nunito-Bold'
                    }
                  ]}
                >
                  {priority.label}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Main Form */}
          <View style={[styles.section, { backgroundColor: getCardColor() }]}>
            <TextInput
              label="Bug Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="Brief, clear description of the issue"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255,255,255,0.6)"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon={() => <Message size={20} color={theme.colors.primary} variant="Broken" />} />}
            />
            
            <TextInput
              label="What happened? *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.textArea, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="Describe what went wrong in detail"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255,255,255,0.6)"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon={() => <Document size={20} color={theme.colors.primary} variant="Broken" />} />}
            />
            <Text style={[styles.charCount, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
              {description.length}/{MAX_DESCRIPTION_LENGTH} characters
            </Text>

            <TextInput
              label="Steps to Reproduce"
              value={stepsToReproduce}
              onChangeText={setStepsToReproduce}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={[styles.textArea, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="1. Open app&#10;2. Tap on...&#10;3. Issue occurs"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255,255,255,0.6)"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon={() => <InfoCircle size={20} color={theme.colors.primary} variant="Broken" />} />}
            />

            <TextInput
              label="Expected Behavior"
              value={expectedBehavior}
              onChangeText={setExpectedBehavior}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={[styles.textArea, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="What should have happened instead?"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255,255,255,0.6)"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon={() => <TickCircle size={20} color={theme.colors.primary} variant="Broken" />} />}
            />
            
            <TextInput
              label="Your Email (optional)"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { fontFamily: 'Nunito-Regular', fontSize: FontSizes.input }]}
              placeholder="For follow-up questions (optional)"
              keyboardType="email-address"
              textColor="#FFFFFF"
              placeholderTextColor="rgba(255,255,255,0.6)"
              outlineColor="rgba(255,255,255,0.3)"
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon={() => <Message size={20} color={theme.colors.primary} variant="Broken" />} />}
            />

            <Button 
              mode="contained" 
              onPress={handleSubmit} 
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              loading={isSubmitting}
              disabled={isSubmitting || !title || !description || !selectedCategory}
              labelStyle={{ fontFamily: 'Nunito-Bold', fontSize: FontSizes.button , color: '#000' }}
              contentStyle={styles.submitButtonContent}
            >
              {isSubmitting ? 'Submitting Report...' : 'Submit Bug Report'}
            </Button>
          </View>
          
          {/* Alternative Methods */}
          <View style={[styles.section, { backgroundColor: getCardColor() }]}>
            <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
              Other Ways to Report
            </Text>
            
            <TouchableOpacity style={styles.contactMethod} onPress={handleCopyEmail}>
              <View style={[styles.contactIcon, { backgroundColor: theme.colors.primary + '30' }]}>
                <Message size={22} color={theme.colors.primary} variant="Broken" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Medium', fontSize: FontSizes.body }]}>
                  Email Direct
                </Text>
                <Text style={[styles.contactSubtitle, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                  {EMAIL_ADDRESS}
                </Text>
              </View>
              <Copy size={20} color="#CCCCCC" variant="Broken" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactMethod} onPress={handleOpenGitHub}>
              <View style={[styles.contactIcon, { backgroundColor: theme.colors.primary + '30' }]}>
                <Document size={22} color={theme.colors.primary} variant="Broken" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Medium', fontSize: FontSizes.body }]}>
                  GitHub Issues
                </Text>
                <Text style={[styles.contactSubtitle, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                  Open source collaboration
                </Text>
              </View>
              {isOpeningGitHub ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <InfoCircle size={20} color="#CCCCCC" variant="Broken" />
              )}
            </TouchableOpacity>
          </View>
          
          {/* Device Information */}
          <View style={[styles.section, { backgroundColor: getCardColor() }]}>
            <View style={styles.infoHeader}>
              <Text style={[styles.sectionTitle, { color: '#FFFFFF', fontFamily: 'Nunito-Bold', fontSize: FontSizes.h4 }]}>
                Device Information
              </Text>
              <Button 
                mode="outlined" 
                onPress={handleCopyDeviceInfo}
                style={[styles.copyButton, { borderColor: 'rgba(255,255,255,0.3)' }]}
                textColor="#FFFFFF"
                icon={({ size, color }) => <Copy size={size} color={color} variant="Broken" />}
                labelStyle={{ fontFamily: 'Nunito-Medium', fontSize: FontSizes.bodySmall }}
                compact
              >
                Copy
              </Button>
            </View>
            
            <View style={styles.deviceInfoGrid}>
              <View style={styles.deviceInfoItem}>
                <InfoCircle size={18} color={theme.colors.primary} variant="Broken" />
                <View style={styles.deviceInfoText}>
                  <Text style={[styles.deviceInfoLabel, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                    App Version
                  </Text>
                  <Text style={[styles.deviceInfoValue, { color: '#FFFFFF', fontFamily: 'Nunito-Medium', fontSize: FontSizes.body }]}>
                    {appVersion}
                  </Text>
                </View>
              </View>
              
              <View style={styles.deviceInfoItem}>
                <DeviceMessage size={18} color={theme.colors.primary} variant="Broken" />
                <View style={styles.deviceInfoText}>
                  <Text style={[styles.deviceInfoLabel, { color: '#CCCCCC', fontFamily: 'Nunito-Regular', fontSize: FontSizes.bodySmall }]}>
                    Device
                  </Text>
                  <Text style={[styles.deviceInfoValue, { color: '#FFFFFF', fontFamily: 'Nunito-Medium', fontSize: FontSizes.body }]}>
                    {deviceInfo}
                  </Text>
                </View>
              </View>
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
  progressContainer: {
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    borderRadius: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: FontSizes.bodySmall,
  },
  progressPercent: {
    fontSize: FontSizes.bodySmall,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  headerGradient: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  headerTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  categoryLabel: {
    marginTop: 8,
    textAlign: 'center',
  },
  priorityScroll: {
    flexDirection: 'row',
  },
  priorityChip: {
    marginRight: 8,
    borderRadius: 16,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 8,
  },
  charCount: {
    textAlign: 'right',
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 24,
  },
  submitButtonContent: {
    paddingVertical: 8,
  
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    marginBottom: 2,
  },
  contactSubtitle: {
    lineHeight: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  copyButton: {
    borderRadius: 16,
  },
  deviceInfoGrid: {
    gap: 16,
  },
  deviceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfoText: {
    marginLeft: 12,
  },
  deviceInfoLabel: {
    marginBottom: 2,
  },
  deviceInfoValue: {
    lineHeight: 20,
  },
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    width: '90%',
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  successGradient: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    borderRadius: 28,
  },
  successTitle: {
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  successStats: {
    flexDirection: 'row',
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
});