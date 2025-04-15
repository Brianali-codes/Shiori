import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const theme = useTheme();
  
  // Default to light if colorScheme is undefined
  const currentScheme = (colorScheme === 'dark' || colorScheme === 'light') ? colorScheme : 'light';

  const getTabIconColor = (focused: boolean) => {
    return focused ? 
      (currentScheme === 'dark' ? '#FFFFFF' : '#000000') : 
      Colors[currentScheme].tabIconDefault;
  };

  const getTabContainerColor = (focused: boolean) => {
    if (!focused) return 'transparent';
    return currentScheme === 'dark' 
      ? 'rgba(0, 0, 0, 0.9)'      // Black container for white icon in dark mode
      : 'rgba(255, 255, 255, 0.9)'; // White container for black icon in light mode
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: currentScheme === 'dark' ? '#FFFFFF' : '#000000',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { backgroundColor: getTabContainerColor(focused) }]}>
              <MaterialCommunityIcons 
                size={28} 
                name="home"
                color={getTabIconColor(focused)} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { backgroundColor: getTabContainerColor(focused) }]}>
              <MaterialCommunityIcons 
                size={28} 
                name="compass"
                color={getTabIconColor(focused)} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { backgroundColor: getTabContainerColor(focused) }]}>
              <MaterialCommunityIcons 
                size={28} 
                name={focused ? "heart" : "heart-outline"}
                color={getTabIconColor(focused)} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconContainer, { backgroundColor: getTabContainerColor(focused) }]}>
              <MaterialCommunityIcons 
                size={28} 
                name="cog"
                color={getTabIconColor(focused)} 
              />
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius:12,
    borderBottomRightRadius:12,
    marginTop: 8,
  },
});
