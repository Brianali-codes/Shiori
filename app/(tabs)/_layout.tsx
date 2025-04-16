import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Home, SearchNormal, Heart, Setting, LocationDiscover, MessageQuestion } from 'iconsax-react-nativejs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { FontSizes } from '@/constants/FontSizes';
import { useThemeContext } from '@/contexts/ThemeContext';

function TabBar() {
  const { isDark, isAmoled } = useThemeContext();
  const insets = useSafeAreaInsets();
  
  const getTabIconColor = (focused: boolean) => {
    if (isDark || isAmoled) {
      return focused ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)';
    } else {
      return focused ? '#000000' : 'rgba(0, 0, 0, 0.6)';
    }
  };
  
  const getTabBarBackground = () => {
    if (isAmoled) return '#000000'; // Pure black for AMOLED
    if (isDark) return '#121212';   // Dark gray for dark mode
    return '#FFFFFF';               // White for light mode
  };

  const tabLabelStyle = {
    fontSize: FontSizes.tabLabel, 
    fontFamily: 'Nunito-Medium',
    marginTop: 2
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark || isAmoled ? '#FFFFFF' : '#000000',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            height: 70,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            overflow: 'hidden',
            backgroundColor: getTabBarBackground(),
            paddingBottom: Math.max(10, insets.bottom),
          },
          default: {
            height: 60,
            borderTopWidth: 0,
            elevation: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            overflow: 'hidden',
            backgroundColor: getTabBarBackground(),
            paddingBottom: 5,
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <Home size={24} color={color} variant={focused ? "Bold" : "Broken"} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Home</Text>}
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <LocationDiscover size={24} color={color} variant={focused ? "Bold" : "Broken"} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Explore</Text>}
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <Heart size={24} color={color} variant={focused ? "Bold" : "Broken"} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Favorites</Text>}
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="bug-report"
        options={{
          title: 'Report Bug',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <MessageQuestion size={24} color={color} variant={focused ? "Bold" : "Broken"} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Report</Text>}
            </View>
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={styles.tabItem}>
              <Setting size={24} color={color} variant={focused ? "Bold" : "Broken"} />
              {focused && <Text style={[styles.tabLabel, { color }]}>Settings</Text>}
            </View>
          ),
          headerShown: false,
        }}
      />
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
  tabBar: {
    height: Platform.OS === 'ios' ? 70 : 60,
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
    backgroundColor: '#121212',
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Nunito-Medium',
    textAlign: 'center',
    width: '100%',
  },
});
