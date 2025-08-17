import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import { Text, Button, useTheme, Portal, Modal, Card } from 'react-native-paper';
import Animated, { 
  FadeIn, 
  FadeOut, 
  FadeInDown, 
  FadeOutUp,
  SlideInRight, 
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { memo, useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';
import { 
  ArrowRight2, 
  Android,
  DocumentText1,
  TickCircle,
  CloseCircle,
  Heart
} from 'iconsax-react-nativejs';

// Constants for version tracking - must match _layout.tsx
const CURRENT_APP_VERSION = '1.0.0'; // Make sure this matches the version in _layout.tsx
const ONBOARDING_VERSION_KEY = 'onboardingCompletedForVersion';

// Define a type for the valid animation names
type AnimationName = 'welcome' | 'search' | 'document' | 'confetti';
import { Platform } from 'react-native';

// Define a type for the onboarding step
type OnboardingStep = {
  title: string;
  description: string;
  lottie: AnimationName;
  gradientColors: readonly [string, string];
  showAgreement?: boolean;
};

const { width, height } = Dimensions.get('window');

// Memoized animation component for better performance
const LottieAnimation = memo(({ animationName }: { animationName: AnimationName }) => {
  const animations = {
    welcome: require('../assets/animations/welcome.json'),
    search: require('../assets/animations/search.json'),
    document: require('../assets/animations/document.json'),
    confetti: require('../assets/animations/confetti.json')
  };

  return (
    <LottieView
      source={animations[animationName]}
      autoPlay
      loop
      style={styles.lottie}
    />
  );
});

// Memoized indicator component
const StepIndicator = memo(({ active, index, total, theme }: { 
  active: boolean, 
  index: number, 
  total: number,
  theme: any 
}) => {
  // Animation values
  const width = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.5);
  const scale = useSharedValue(active ? 1 : 0.8);
  const translateY = useSharedValue(active ? 0 : 2);
  
  useEffect(() => {
    // Apply animations when active state changes
    if (active) {
      // When becoming active
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 150 })
      );
      width.value = withSpring(24, {
        mass: 0.8,
        damping: 8,
        stiffness: 100,
        overshootClamping: false,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01
      });
      opacity.value = withTiming(1, { duration: 250 });
      translateY.value = withSequence(
        withTiming(-3, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    } else {
      // When becoming inactive
      scale.value = withTiming(0.8, { duration: 200 });
      width.value = withSpring(8, {
        mass: 0.5,
        damping: 9,
        stiffness: 100
      });
      opacity.value = withTiming(0.5, { duration: 200 });
      translateY.value = withTiming(2, { duration: 200 });
    }
  }, [active]);
  
  // Wrap the animated styles in a container
  return (
    <View style={styles.indicatorContainer}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: width,
            opacity: opacity,
            transform: [
              { scale: scale },
              { translateY: translateY }
            ],
            backgroundColor: active 
              ? theme.colors.primary 
              : theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            // Fixed shadow styling
            ...Platform.select({
              ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: active ? 2 : 0 },
                shadowOpacity: active ? 0.5 : 0,
                shadowRadius: 4,
              },
              android: {
                elevation: active ? 2 : 0,
              },
            }),
          }
        ]}
      />
    </View>
  );
});

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [agreementVisible, setAgreementVisible] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const slideDirection = useSharedValue(1); // 1 for forward, -1 for backward
  const contentOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const backgroundProgress = useSharedValue(1);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Add a function to trigger haptic feedback (simulation)
  const triggerHaptic = useCallback(() => {
    if (hapticFeedback) {
      // In a real app, you would use a library like expo-haptics:
      // import * as Haptics from 'expo-haptics';
      // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      console.log("Haptic feedback triggered");
    }
  }, [hapticFeedback]);

  // Simulated sound effect function
  const playSound = useCallback((soundName: string) => {
    if (soundEffects) {
      // In a real app, you would use a library like expo-av:
      // const sound = new Audio.Sound();
      // await sound.loadAsync(require(`../assets/sounds/${soundName}.mp3`));
      // await sound.playAsync();
      console.log(`Playing sound: ${soundName}`);
    }
  }, [soundEffects]);

  const onboardingSteps: OnboardingStep[] = [
    {
      title: 'Welcome to Shiori',
      description: 'Discover and collect beautiful wallpapers for your device. Your perfect wallpaper is just a tap away.',
      lottie: 'welcome',
      gradientColors: theme.dark 
        ? ['#121212', '#2D3047'] as const
        : ['#F8F9FA', '#E9ECEF'] as const
    },
    {
      title: 'Browse & Search',
      description: 'Explore millions of wallpapers from talented artists. Search by categories, colors, or keywords.',
      lottie: 'search',
      gradientColors: theme.dark 
        ? ['#121212', '#1A3A59'] as const
        : ['#F8F9FA', '#D7E3FC'] as const
    },
    {
      title: 'Terms & Conditions',
      description: 'Please read and accept our terms of service and privacy policy to continue.',
      lottie: 'document',
      gradientColors: theme.dark 
        ? ['#121212', '#2D2A4A'] as const
        : ['#F8F9FA', '#E6E6FA'] as const,
      showAgreement: true
    },
    {
      title: "Let's Begin!",
      description: 'Ready to personalize your device with amazing wallpapers?',
      lottie: 'confetti',
      gradientColors: theme.dark 
        ? ['#121212', '#003B36'] as const
        : ['#F8F9FA', '#D1FAE5'] as const
    }
  ];

  // Optimize with useCallback
  const handleSkip = useCallback(async () => {
    triggerHaptic();
    playSound('skip');
    console.log('Skipping onboarding - Setting AsyncStorage key:', ONBOARDING_VERSION_KEY);
    console.log('Skipping onboarding - Setting value:', CURRENT_APP_VERSION);
    try {
      // First check if we can read from AsyncStorage
      const testRead = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
      console.log('Current AsyncStorage value before skip:', testRead);
      
      // Then try to write to AsyncStorage
      await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_APP_VERSION);
      
      // Verify the write was successful
      const verifyWrite = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
      console.log('AsyncStorage value after skip:', verifyWrite);
      
      if (verifyWrite === CURRENT_APP_VERSION) {
        console.log('Skipping onboarding - AsyncStorage set successfully');
      } else {
        console.error('AsyncStorage verification failed - expected:', CURRENT_APP_VERSION, 'got:', verifyWrite);
      }
    } catch (error) {
      console.error('Error setting AsyncStorage in handleSkip:', error);
    }
    router.replace('/(tabs)');
  }, [triggerHaptic, playSound]);

  const transitionToNextStep = useCallback((nextStep: number) => {
    setCurrentStep(nextStep);
    setIsAnimating(false);
    
    // Animate background
    backgroundProgress.value = withSequence(
      withTiming(0.5, { duration: 200 }),
      withTiming(1, { duration: 500 })
    );
    
    // Animate content back in
    contentOpacity.value = withTiming(1, { duration: 400 });
    contentScale.value = withTiming(1, { duration: 400 });
    contentTranslateX.value = withTiming(0, { duration: 400 });
  }, [backgroundProgress, contentOpacity, contentScale, contentTranslateX]);

  const handleNext = useCallback(async () => {
    if (isAnimating) return;
    
    triggerHaptic();
    playSound('next');
    
    // Check for agreement screen
    if (currentStep === 2 && !agreementAccepted) {
      setAgreementVisible(true);
      return;
    }

    // Check if we're on the last step
    if (currentStep < onboardingSteps.length - 1) {
      setIsAnimating(true);
      slideDirection.value = 1;
      
      // Animate content out
      contentOpacity.value = withTiming(0, { duration: 300 });
      contentScale.value = withTiming(0.9, { duration: 300 });
      contentTranslateX.value = withTiming(-width * 0.2, { duration: 300 });
      
      // Transition to next step after animation
      setTimeout(() => {
        transitionToNextStep(currentStep + 1);
      }, 300);
    } else {
      // Last step - complete onboarding with a celebratory haptic
      triggerHaptic();
      playSound('success');
      console.log('Completing onboarding - Setting AsyncStorage key:', ONBOARDING_VERSION_KEY);
      console.log('Completing onboarding - Setting value:', CURRENT_APP_VERSION);
      try {
        // First check if we can read from AsyncStorage
        const testRead = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
        console.log('Current AsyncStorage value before completion:', testRead);
        
        // Then try to write to AsyncStorage
        await AsyncStorage.setItem(ONBOARDING_VERSION_KEY, CURRENT_APP_VERSION);
        
        // Verify the write was successful
        const verifyWrite = await AsyncStorage.getItem(ONBOARDING_VERSION_KEY);
        console.log('AsyncStorage value after completion:', verifyWrite);
        
        if (verifyWrite === CURRENT_APP_VERSION) {
          console.log('Completing onboarding - AsyncStorage set successfully');
        } else {
          console.error('AsyncStorage verification failed - expected:', CURRENT_APP_VERSION, 'got:', verifyWrite);
        }
      } catch (error) {
        console.error('Error setting AsyncStorage in handleNext:', error);
      }
      router.replace('/(tabs)');
    }
  }, [currentStep, agreementAccepted, isAnimating, onboardingSteps.length, slideDirection, contentOpacity, contentScale, contentTranslateX, transitionToNextStep, triggerHaptic, playSound]);

  // Handle back button functionality
  const handleBack = useCallback(() => {
    if (isAnimating || currentStep === 0) return;
    
    triggerHaptic();
    playSound('back');
    
    setIsAnimating(true);
    slideDirection.value = -1;
    
    // Animate content out in reverse direction
    contentOpacity.value = withTiming(0, { duration: 300 });
    contentScale.value = withTiming(0.9, { duration: 300 });
    contentTranslateX.value = withTiming(width * 0.2, { duration: 300 });
    
    // Transition to previous step after animation
    setTimeout(() => {
      transitionToNextStep(currentStep - 1);
    }, 300);
  }, [currentStep, isAnimating, slideDirection, contentOpacity, contentScale, contentTranslateX, transitionToNextStep, triggerHaptic, playSound]);

  // Content animation style
  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        { scale: contentScale.value },
        { translateX: contentTranslateX.value }
      ]
    };
  });

  // Background animation style
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        backgroundProgress.value,
        [0, 0.5, 1],
        [1, 0.7, 1],
        Extrapolate.CLAMP
      )
    };
  });

  // Button animation
  const buttonScaleAnim = useSharedValue(1);
  
  const handlePressIn = useCallback(() => {
    buttonScaleAnim.value = withTiming(0.95, { duration: 100 });
  }, [buttonScaleAnim]);
  
  const handlePressOut = useCallback(() => {
    buttonScaleAnim.value = withTiming(1, { duration: 100 });
  }, [buttonScaleAnim]);
  
  const buttonAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScaleAnim.value }]
    };
  });

  // Settings modal state
  const [settingsVisible, setSettingsVisible] = useState(false);

  const canGoBack = currentStep > 0;

  return (
    <View style={styles.container}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      
      {/* Background gradient with animation */}
      <Animated.View style={[styles.backgroundContainer, animatedBackgroundStyle]}>
        <LinearGradient
          colors={onboardingSteps[currentStep].gradientColors}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Optional: Add subtle pattern overlay for dark mode */}
        {theme.dark && (
          <View style={styles.patternOverlay} pointerEvents="none">
            {/* Use a more efficient pattern for better performance */}
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <View key={`row-${rowIndex}`} style={{ flexDirection: 'row' }}>
                {Array.from({ length: 10 }).map((_, colIndex) => (
                  <View 
                    key={`dot-${rowIndex}-${colIndex}`} 
                    style={{
                      width: 2,
                      height: 2,
                      borderRadius: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      margin: 20
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </Animated.View>
      
      <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        {/* Header navigation */}
        <View style={styles.headerNav}>
          {canGoBack && (
            <Animated.View entering={FadeIn.duration(400)}>
              <Button
                mode="text"
                onPress={handleBack}
                textColor={theme.dark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'}
                labelStyle={{ fontFamily: 'Nunito-SemiBold' }}
                icon={({ size, color }) => (
                  <ArrowRight2 size={size} color={color} variant="Broken" style={{ transform: [{ rotate: '180deg' }] }} />
                )}
              >
                Back
              </Button>
            </Animated.View>
          )}
          
          <View style={{ flex: 1 }} />
          
          {/* Settings button */}
          <Animated.View entering={FadeIn.duration(400)}>
            <Button
              mode="text"
              onPress={() => setSettingsVisible(true)}
              textColor={theme.dark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)'}
              labelStyle={{ fontFamily: 'Nunito-SemiBold' }}
              icon={({ size, color }) => (
                <DocumentText1 size={size} color={color} variant="Broken" />
              )}
            >
              Settings
            </Button>
          </Animated.View>
          
          {/* Skip button */}
          {currentStep < onboardingSteps.length - 1 && (
            <Animated.View entering={FadeIn.duration(600)}>
              <Button
                mode="text"
                onPress={handleSkip}
                textColor={theme.dark ? theme.colors.primary : theme.colors.primary}
                labelStyle={{ fontFamily: 'Nunito-SemiBold' }}
              >
                Skip
              </Button>
            </Animated.View>
          )}
        </View>
        
        {/* Main content with fixed layout structure */}
        <View style={styles.mainContentWrapper}>
          <Animated.View 
            style={[styles.mainContent, animatedContentStyle]}
            entering={FadeIn.duration(600)}
          >
            {/* Animation Container */}
            <View style={styles.animationContainer}>
              <LottieAnimation animationName={onboardingSteps[currentStep].lottie} />
            </View>
            
            {/* Text Container - Separated from animation */}
            <View style={[
              styles.textContainer,
              { backgroundColor: theme.dark ? 'rgba(18, 18, 18, 0.7)' : 'rgba(255, 255, 255, 0.85)' }
            ]}>
              <Text variant="headlineMedium" style={[styles.title, { 
                color: theme.dark ? theme.colors.primary : theme.colors.primary,
                fontFamily: 'Nunito-Bold'
              }]}>
                {onboardingSteps[currentStep].title}
              </Text>
              
              <Text variant="bodyLarge" style={[styles.description, {
                color: theme.dark ? theme.colors.onSurface : theme.colors.onSurface,
                fontFamily: 'Nunito-Regular'
              }]}>
                {onboardingSteps[currentStep].description}
              </Text>
              
              {onboardingSteps[currentStep].showAgreement && !agreementAccepted && (
                <Button
                  mode="outlined"
                  onPress={() => setAgreementVisible(true)}
                  style={styles.termsButton}
                  labelStyle={{ fontFamily: 'Nunito-Medium' }}
                  icon={({ size, color }) => (
                    <DocumentText1 size={size} color={color} variant="Broken" />
                  )}
                >
                  Read Terms & Conditions
                </Button>
              )}
              
              {onboardingSteps[currentStep].showAgreement && agreementAccepted && (
                <View style={styles.acceptedContainer}>
                  <TickCircle
                    size={24}
                    color={theme.colors.primary}
                    variant="Broken"
                  />
                  <Text style={{ color: theme.colors.primary, fontFamily: 'Nunito-Medium' }}>
                    Terms accepted
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.indicators}>
            {onboardingSteps.map((_, index) => (
              <StepIndicator
                key={index}
                active={currentStep === index}
                index={index}
                total={onboardingSteps.length}
                theme={theme}
              />
            ))}
          </View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Animated.View style={[styles.buttonContainer, buttonAnimStyle]}>
              <Button
                mode="contained"
                onPress={handleNext}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[styles.button]}
                contentStyle={styles.buttonContent}
                labelStyle={{
                  fontSize: 16,
                  fontFamily: 'Nunito-Bold'
                }}
                icon={({ size, color }) => 
                  currentStep === onboardingSteps.length - 1 ? (
                    <Android size={size} color={color} variant="Broken" />
                  ) : (
                    <ArrowRight2 size={size} color={color} variant="Broken" />
                  )
                }
              >
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
              </Button>
            </Animated.View>
          </Animated.View>
          
          {/* Progress indicator */}
          <Animated.View 
            entering={FadeIn.delay(300).duration(500)}
            style={styles.progressTextContainer}
          >
            <Text style={[styles.progressText, { 
              color: theme.dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              fontFamily: 'Nunito-Medium'
            }]}>
              {currentStep + 1} of {onboardingSteps.length}
            </Text>
          </Animated.View>
        </View>
      </View>

      {/* Terms and Conditions Modal */}
      <Portal>
        <Modal
          visible={agreementVisible}
          onDismiss={() => setAgreementVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.elevation.level3 }]}
        >
          <Card style={styles.modalCard}>
            <Card.Title 
              title="Terms & Conditions" 
              titleStyle={{ fontFamily: 'Nunito-Bold' }}
              left={(props) => <DocumentText1 size={24} color={theme.colors.primary} variant="Broken" />}
            />
            <Card.Content>
              <ScrollView style={styles.agreementScroll}>
                <Text style={{ 
                  lineHeight: 24,
                  fontFamily: 'Nunito-Regular',
                  color: theme.colors.onSurface
                }}>
                  1. Acceptance of Terms{'\n\n'}
                  By using Shiori, you agree to these terms and conditions. These terms apply to all users of the application.
                  {'\n\n'}
                  2. Wallpaper Content{'\n\n'}
                  • All wallpapers are sourced from Wallhaven and are subject to their respective licenses.{'\n'}
                  • Some wallpapers may require a Wallhaven API key to access.{'\n'}
                  • Users must comply with content ratings and restrictions.
                  {'\n\n'}
                  3. User Responsibilities{'\n\n'}
                  • You agree to use the app for personal, non-commercial purposes.{'\n'}
                  • You will not attempt to circumvent any content restrictions.{'\n'}
                  • You are responsible for any data charges incurred while using the app.
                  {'\n\n'}
                  4. Privacy & Data{'\n\n'}
                  • We collect minimal data necessary for app functionality.{'\n'}
                  • Your Wallhaven API key, if provided, is stored securely on your device.{'\n'}
                  • We do not share any personal information with third parties.
                  {'\n\n'}
                  5. Content Restrictions{'\n\n'}
                  • NSFW content requires age verification and a valid Wallhaven API key.{'\n'}
                  • Users must comply with their local laws regarding content access.
                  {'\n\n'}
                  6. Changes to Terms{'\n\n'}
                  We reserve the right to modify these terms at any time. Continued use of the app constitutes acceptance of any changes.
                </Text>
              </ScrollView>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button 
                onPress={() => setAgreementVisible(false)}
                textColor={theme.colors.error}
                labelStyle={{ fontFamily: 'Nunito-Medium' }}
                icon={({ size, color }) => (
                  <CloseCircle size={size} color={color} variant="Broken" />
                )}
              >
                Decline
              </Button>
              <Button 
                mode="contained"
                onPress={() => {
                  setAgreementAccepted(true);
                  setAgreementVisible(false);
                  triggerHaptic();
                  playSound('success');
                }}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ fontFamily: 'Nunito-Medium' }}
                icon={({ size, color }) => (
                  <TickCircle size={size} color={color} variant="Broken" />
                )}
              >
                Accept
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
      
      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={settingsVisible}
          onDismiss={() => setSettingsVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.elevation.level3 }]}
        >
          <Card style={styles.modalCard}>
            <Card.Title 
              title="Settings" 
              titleStyle={{ fontFamily: 'Nunito-Bold' }}
            />
            <Card.Content>
              <View style={styles.settingsRow}>
                <Text style={{ 
                  fontFamily: 'Nunito-Medium',
                  color: theme.colors.onSurface
                }}>Haptic Feedback</Text>
                <Button
                  mode={hapticFeedback ? "contained" : "outlined"}
                  onPress={() => setHapticFeedback(!hapticFeedback)}
                  style={[styles.toggleButton, hapticFeedback ? { backgroundColor: theme.colors.primary } : {}]}
                  labelStyle={{ fontFamily: 'Nunito-Medium' }}
                >
                  {hapticFeedback ? 'On' : 'Off'}
                </Button>
              </View>
              
              <View style={styles.settingsRow}>
                <Text style={{ 
                  fontFamily: 'Nunito-Medium',
                  color: theme.colors.onSurface
                }}>Sound Effects</Text>
                <Button
                  mode={soundEffects ? "contained" : "outlined"}
                  onPress={() => setSoundEffects(!soundEffects)}
                  style={[styles.toggleButton, soundEffects ? { backgroundColor: theme.colors.primary } : {}]}
                  labelStyle={{ fontFamily: 'Nunito-Medium' }}
                >
                  {soundEffects ? 'On' : 'Off'}
                </Button>
              </View>
              
              <View style={styles.settingsInfo}>
                <Heart size={18} color={theme.colors.primary} variant="Broken" />
                <Text style={{ 
                  fontFamily: 'Nunito-Regular',
                  color: theme.colors.onSurfaceVariant,
                  fontSize: 14,
                  marginLeft: 8,
                  flex: 1
                }}>
                  Settings will be applied to your entire experience with Shiori
                </Text>
              </View>
            </Card.Content>
            <Card.Actions style={styles.modalActions}>
              <Button 
                mode="contained"
                onPress={() => setSettingsVisible(false)}
                style={{ backgroundColor: theme.colors.primary }}
                labelStyle={{ fontFamily: 'Nunito-Medium' }}
              >
                Done
              </Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  indicatorContainer: {
    padding: 4,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
    backgroundColor: 'transparent',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  mainContentWrapper: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  animationContainer: {
    height: height * 0.30, // Slightly reduced height
    width: width * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20, // Add space between animation and text
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    padding: 20,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#000000', // Solid black
    ...Platform.select({
      ios: {
        // Keep iOS shadow if you want (remove if not needed)
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        // No elevation or shadow on Android
        elevation: 0,
      },
    }),
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  description: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 24,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  termsButton: {
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 4,
  },
  acceptedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 128, 0, 0.1)',
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 22,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 20,
    width: '80%',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
    }),
  },
  buttonContent: {
    height: 56,
    flexDirection: 'row-reverse',
  },
  progressTextContainer: {
    alignItems: 'center',
    marginTop: -8,
  },
  progressText: {
    fontSize: 14,
  },
  modal: {
    margin: 20,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalCard: {
    borderRadius: -1, // Disable card's own border radius
  },
  agreementScroll: {
    maxHeight: 400,
    marginVertical: 16,
  },
  modalActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  toggleButton: {
    borderRadius: 20,
    minWidth: 80,
  },
  settingsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 12,
  },
});

export default OnboardingScreen;