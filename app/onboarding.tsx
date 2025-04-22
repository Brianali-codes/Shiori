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
  CloseCircle
} from 'iconsax-react-nativejs';

// Define a type for the valid animation names
type AnimationName = 'welcome' | 'search' | 'document' | 'confetti';

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
  const width = useSharedValue(active ? 24 : 8);
  const opacity = useSharedValue(active ? 1 : 0.5);
  
  useEffect(() => {
    width.value = withSpring(active ? 24 : 8, {
      mass: 0.5,
      damping: 9,
      stiffness: 100
    });
    opacity.value = withTiming(active ? 1 : 0.5, { duration: 300 });
  }, [active]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
      opacity: opacity.value,
      backgroundColor: active 
        ? theme.colors.primary 
        : theme.dark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
    };
  });
  
  return (
    <Animated.View
      style={[styles.indicator, animatedStyle]}
    />
  );
});

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [agreementVisible, setAgreementVisible] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const slideDirection = useSharedValue(1); // 1 for forward, -1 for backward
  const contentOpacity = useSharedValue(1);
  const contentScale = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const backgroundProgress = useSharedValue(1);
  const theme = useTheme();
  const insets = useSafeAreaInsets();

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
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    router.replace('/(tabs)');
  }, []);

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
      // Last step - complete onboarding
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      router.replace('/(tabs)');
    }
  }, [currentStep, agreementAccepted, isAnimating, onboardingSteps.length, slideDirection, contentOpacity, contentScale, contentTranslateX, transitionToNextStep]);

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
        {/* Skip button */}
        <Animated.View 
          entering={FadeIn.duration(600)}
          style={styles.skipButton}
        >
          {currentStep < onboardingSteps.length - 1 && (
            <Button
              mode="text"
              onPress={handleSkip}
              textColor={theme.dark ? theme.colors.primary : theme.colors.primary}
              labelStyle={{ fontFamily: 'Nunito-SemiBold' }}
            >
              Skip
            </Button>
          )}
        </Animated.View>
        
        {/* Main content */}
        <Animated.View style={[styles.mainContent, animatedContentStyle]}>
          <View style={styles.animationContainer}>
            <LottieAnimation animationName={onboardingSteps[currentStep].lottie} />
          </View>
          
          <BlurView 
            intensity={theme.dark ? 20 : 40} 
            tint={theme.dark ? 'dark' : 'light'}
            style={styles.cardContainer}
          >
            <View style={[styles.card, { backgroundColor: theme.dark ? 'rgba(18, 18, 18, 0.7)' : 'rgba(255, 255, 255, 0.85)' }]}>
              <Text variant="headlineMedium" style={[styles.title, { 
                color: theme.dark ? theme.colors.primary : theme.colors.primary,
                fontFamily: 'Nunito-Bold'
              }]}>
                {onboardingSteps[currentStep].title}
              </Text>
              
              <Text variant="bodyLarge" style={[styles.description, {
                color: theme.dark ? theme.colors.onBackground : theme.colors.onBackground,
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
          </BlurView>
        </Animated.View>
        
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

          <Animated.View 
            entering={FadeInDown.delay(200).duration(400)}
            exiting={FadeOutUp.duration(300)}
            style={[styles.buttonContainer, buttonAnimStyle]}
          >
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
        </View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  skipButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginTop: 8,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: height * 0.35,
    width: width * 0.8,
    marginBottom: 32,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  card: {
    padding: 28,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 28,
  },
  description: {
    textAlign: 'center',
    maxWidth: width * 0.85,
    lineHeight: 26,
    marginBottom: 16,
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
    gap: 32,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    borderRadius: 20,
    width: '80%',
    elevation: 4,
  },
  buttonContent: {
    height: 56,
    flexDirection: 'row-reverse',
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
});

export default OnboardingScreen;