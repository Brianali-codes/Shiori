import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text, useTheme } from 'react-native-paper';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();

  const getTabBarColor = (focused: boolean) => {
    return focused ? Colors[colorScheme ?? 'light'].tint : Colors[colorScheme ?? 'light'].tabIconDefault;
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: 60,
          },
          default: {
            height: 60,
            borderTopWidth: 0,
            elevation: 0,
          },
        }),
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <IconSymbol 
                size={24} 
                name={focused ? "house.fill" : "house"}
                color={getTabBarColor(focused)} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <IconSymbol 
                size={24} 
                name={focused ? "safari.fill" : "safari"}
                color={getTabBarColor(focused)} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <IconSymbol 
                size={24} 
                name={focused ? "heart.fill" : "heart"}
                color={getTabBarColor(focused)} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <IconSymbol 
                size={24} 
                name={focused ? "gearshape.fill" : "gearshape"}
                color={getTabBarColor(focused)} 
              />
              {focused && <View style={[styles.activeIndicator, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  activeIndicator: {
    height: 4,
    width: 4,
    borderRadius: 2,
    marginTop: 4,
  }
});
