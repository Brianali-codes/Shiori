import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Home, LocationDiscover, Heart, InfoCircle, Setting } from 'iconsax-react-nativejs';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTheme } from 'react-native-paper';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const { isDark, isAmoled } = useThemeContext();
  const theme = useTheme();
  
  // Match icon colors to the theme
  const getTabIconColor = (focused: boolean) => {
    // In dark or amoled mode, use white icons
    if (isDark || isAmoled) {
      return focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
    }
    // In light mode, use black icons
    return focused ? '#000000' : 'rgba(0, 0, 0, 0.6)';
  };
  
  // Get tab bar background color based on theme
  const getTabBarBackground = () => {
    if (isAmoled) return '#000000'; // Pure black for AMOLED
    if (isDark) return '#121212';   // Dark gray for dark mode
    return '#FFFFFF';               // White for light mode
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark || isAmoled ? '#FFFFFF' : '#000000',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false, // Hide default labels
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            backgroundColor: getTabBarBackground(),
          },
          default: {
            height: 70,
            borderTopWidth: 0,
            elevation: 0,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            backgroundColor: getTabBarBackground(),
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.iconContainer}>
                <Home
                  size={28} 
                  color={getTabIconColor(focused)}
                  variant="Broken"
                />
              </View>
              {focused && (
                <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                  Home
                </Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.iconContainer}>
                <LocationDiscover
                  size={28} 
                  color={getTabIconColor(focused)}
                  variant="Broken"
                />
              </View>
              {focused && (
                <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                  Explore
                </Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.iconContainer}>
                <Heart
                  size={28} 
                  color={getTabIconColor(focused)}
                  variant="Broken"
                />
              </View>
              {focused && (
                <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                  Favorites
                </Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bug-report"
        options={{
          title: 'Report',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.iconContainer}>
                <InfoCircle
                  size={28} 
                  color={getTabIconColor(focused)}
                  variant="Broken"
                />
              </View>
              {focused && (
                <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                  Report
                </Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <View style={styles.iconContainer}>
                <Setting
                  size={28} 
                  color={getTabIconColor(focused)}
                  variant="Broken"
                />
              </View>
              {focused && (
                <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                  Settings
                </Text>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    paddingHorizontal: 8,
    height: '100%',
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    fontWeight: '500',
    marginTop: 6,
  },
});
