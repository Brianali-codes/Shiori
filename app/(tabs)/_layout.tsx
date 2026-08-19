import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Home, LocationDiscover, Setting } from 'iconsax-react-nativejs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { FontSizes } from '@/constants/FontSizes';
import { useThemeContext } from '@/contexts/ThemeContext';

function TabBar() {
  const { isDark, isAmoled } = useThemeContext();
  const insets = useSafeAreaInsets();

  const getTabBarBackground = () => {
    if (isAmoled) return 'rgba(0, 0, 0, 0.85)';
    if (isDark) return 'rgba(18, 18, 18, 0.82)';
    return 'rgba(255, 255, 255, 0.82)';
  };

  const getGlassBorderColor = () => {
    if (isDark || isAmoled) return 'rgba(255, 255, 255, 0.14)';
    return 'rgba(0, 0, 0, 0.08)';
  };

  const getActivePillColor = () => {
    if (isDark || isAmoled) return 'rgba(255, 255, 255, 0.16)';
    return 'rgba(0, 0, 0, 0.08)';
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark || isAmoled ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: isDark || isAmoled ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Math.max(insets.bottom + 8, 18),
          left: 44, // Increased from 24 to make the tab bar narrower
          right: 44, // Increased from 24 to make the tab bar narrower
          height: 60,
          borderRadius: 30,
          backgroundColor: getTabBarBackground(),
          borderWidth: 1,
          borderColor: getGlassBorderColor(),
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark || isAmoled ? 0.45 : 0.12,
          shadowRadius: 16,
          paddingBottom: 0,
          paddingHorizontal: 8,
          overflow: 'hidden',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabItem, focused && [styles.activeTabPill, { backgroundColor: getActivePillColor() }]]}>
              <Home size={20} color={color} variant={focused ? 'Bold' : 'Broken'} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Home</Text>}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabItem, focused && [styles.activeTabPill, { backgroundColor: getActivePillColor() }]]}>
              <LocationDiscover size={20} color={color} variant={focused ? 'Bold' : 'Broken'} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Explore</Text>}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabItem, focused && [styles.activeTabPill, { backgroundColor: getActivePillColor() }]]}>
              <Setting size={20} color={color} variant={focused ? 'Bold' : 'Broken'} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Settings</Text>}
            </View>
          ),
        }}
      />

      {/* Hidden from tab bar, but routes remain active for navigation */}
      <Tabs.Screen name="favorites" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="bug-report" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="premium" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TabBar />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  activeTabPill: {
    // Dynamic active background applied inline based on theme
  },
  tabLabel: {
    fontSize: FontSizes.tabLabel || 12,
    fontFamily: 'Nunito-Medium',
    textAlign: 'center',
  },
});