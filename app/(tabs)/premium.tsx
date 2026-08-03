import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import {
  Crown1,
  Eye,
  Heart,
  Flash,
  Notification1,
  ArrowLeft2,
  Lock,
} from 'iconsax-react-nativejs';
import { Text, Button, useTheme } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { ThemedView } from '@/components/ThemedComponents';
import { FontSizes } from '@/constants/FontSizes';

// TODO: Replace with your actual Ko-fi membership/tier URL
const KO_FI_URL = 'https://ko-fi.com/brianali-codes';

type PlanId = 'monthly';

const PLANS: {
  id: PlanId;
  label: string;
  price: string;
  period: string;
}[] = [
  {
    id: 'monthly',
    label: 'Monthly Supporter',
    price: '$5.00',
    period: '/ month',
  },
];

const FEATURES = [
  {
    icon: Flash,
    title: 'Early Access',
    description: 'Get first-look updates and access to newly added wallpapers ahead of everyone.',
  },
  {
    icon: Heart,
    title: 'Support Developer',
    description: 'Help fund ongoing updates, server bandwidth, and new feature releases.',
  },
  {
    icon: Notification1,
    title: 'Announcements & Updates',
    description: 'Receive exclusive developer logs, upcoming feature previews, and notes.',
  },
  {
    icon: Eye,
    title: 'Access to NSFW Toggle',
    description: 'Unlock the ability to toggle and view NSFW & sketchy content filters.',
  },
];

export default function PremiumScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedPlan] = useState<PlanId>('monthly');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const activatePremium = async () => {
    try {
      await AsyncStorage.setItem('isPremiumUser', 'true');
      Alert.alert(
        'Welcome to Premium 🎉',
        'Thank you for supporting the project! Premium features are now unlocked.',
        [{ text: 'Continue', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to update premium status:', error);
      Alert.alert('Error', 'Failed to save local premium status. Please try again.');
    }
  };

  const handleSubscribe = async () => {
    try {
      setPurchasing(true);

      // 1. Open the Ko-fi page inside the web browser modal
      await WebBrowser.openBrowserAsync(KO_FI_URL);

      // 2. Prompt user once they close or return from the browser
      Alert.alert(
        'Confirm Subscription',
        'Did you complete your $5/month Ko-fi membership subscription?',
        [
          { text: 'Not Yet', style: 'cancel' },
          {
            text: 'Yes, I Subscribed',
            onPress: () => activatePremium(),
          },
        ]
      );
    } catch (error) {
      console.error('Ko-fi redirect failed:', error);
      Alert.alert('Error', 'Unable to open the subscription link. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);

      const isPremium = await AsyncStorage.getItem('isPremiumUser');

      if (isPremium === 'true') {
        Alert.alert('Active Subscription Found', 'Your premium features are already unlocked on this device.');
      } else {
        Alert.alert(
          'Restore Status',
          'If you have an active Ko-fi subscription, confirm below to re-enable your features on this device.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Re-verify & Restore',
              onPress: () => activatePremium(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('Restore Failed', 'Something went wrong restoring your status.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ThemedView style={styles.container}>
        <StatusBar style="auto" />
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: theme.colors.outlineVariant }]}
          >
            <ArrowLeft2 size={22} color={theme.colors.onSurface} variant="Broken" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <LinearGradient
              colors={[theme.colors.primaryContainer, 'transparent']}
              style={styles.heroGradient}
            >
              <View style={styles.crownWrap}>
                <Crown1 size={38} color={theme.colors.primary} variant="Bold" />
              </View>
              <Text style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                Shiori Premium
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Unlock NSFW filters, support future development, and get early content access.
              </Text>
            </LinearGradient>
          </View>

          {/* Features Section */}
          <View style={styles.featureList}>
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index} style={styles.featureRow}>
                  <View
                    style={[
                      styles.featureIconWrap,
                      { backgroundColor: theme.colors.primaryContainer },
                    ]}
                  >
                    <Icon size={20} color={theme.colors.primary} variant="Broken" />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.colors.onSurface }]}>
                      {feature.title}
                    </Text>
                    <Text
                      style={[
                        styles.featureDescription,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Tier Selection */}
          <View style={styles.plansSection}>
            <Text style={[styles.plansSectionTitle, { color: theme.colors.onSurface }]}>
              Membership Tier
            </Text>
            <View style={styles.plansRow}>
              {PLANS.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      { borderColor: theme.colors.outlineVariant },
                      selected && {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.primaryContainer,
                      },
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.planLabel,
                        { color: theme.colors.onSurface },
                        selected && { color: theme.colors.primary },
                      ]}
                    >
                      {plan.label}
                    </Text>
                    <Text
                      style={[
                        styles.planPrice,
                        { color: theme.colors.onSurface },
                        selected && { color: theme.colors.primary },
                      ]}
                    >
                      {plan.price}
                      <Text style={[styles.planPeriod, { color: theme.colors.onSurfaceVariant }]}>
                        {' '}
                        {plan.period}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CTA Button */}
          <Button
            mode="contained"
            onPress={handleSubscribe}
            loading={purchasing}
            disabled={purchasing}
            style={styles.subscribeButton}
            contentStyle={styles.subscribeButtonContent}
            labelStyle={styles.subscribeButtonLabel}
          >
            {purchasing ? 'Redirecting…' : 'Subscribe via Ko-fi ($5/mo)'}
          </Button>

          {/* Restore / Verification Button */}
          <TouchableOpacity
            onPress={handleRestore}
            disabled={restoring}
            style={styles.restoreButton}
          >
            <Text style={[styles.restoreText, { color: theme.colors.onSurfaceVariant }]}>
              {restoring ? 'Checking status…' : 'Already Subscribed? Restore Status'}
            </Text>
          </TouchableOpacity>

          {/* Terms / Disclaimer */}
          <Text style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
            Subscriptions are processed securely via Ko-fi. You can manage or cancel your recurring
            monthly support anytime directly through your Ko-fi account.
          </Text>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderWidth: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  crownWrap: {
    marginBottom: 10,
  },
  heroTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h2,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.body,
    textAlign: 'center',
    opacity: 0.85,
  },
  featureList: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.caption,
    opacity: 0.75,
  },
  plansSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  plansSectionTitle: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
    marginBottom: 12,
  },
  plansRow: {
    flexDirection: 'row',
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  planLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.h3,
  },
  planPeriod: {
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.caption,
    opacity: 0.7,
  },
  subscribeButton: {
    marginHorizontal: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  subscribeButtonContent: {
    paddingVertical: 6,
  },
  subscribeButtonLabel: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.body,
  },
  restoreButton: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreText: {
    fontFamily: 'Nunito-Bold',
    fontSize: FontSizes.caption,
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontFamily: 'Nunito-Regular',
    fontSize: FontSizes.caption,
    opacity: 0.6,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
  },
});

