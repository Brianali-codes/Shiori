import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { Home, LocationDiscover, Heart, InfoCircle, Setting } from 'iconsax-react-nativejs';
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
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: 'hidden',
            backgroundColor: getTabBarBackground(),
            paddingBottom: Math.max(10, insets.bottom),
          },
          default: {
            height: 60,
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
                  size={20} 
                  color={getTabIconColor(focused)}
                  variant={focused ? "Bold" : "Broken"}
                />
              </View>
              {focused && (
                <View style={styles.labelContainer}>
                  <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                    Home
                  </Text>
                </View>
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
                  size={20} 
                  color={getTabIconColor(focused)}
                  variant={focused ? "Bold" : "Broken"}
                />
              </View>
              {focused && (
                <View style={styles.labelContainer}>
                  <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                    Explore
                  </Text>
                </View>
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
                  size={20} 
                  color={getTabIconColor(focused)}
                  variant={focused ? "Bold" : "Broken"}
                />
              </View>
              {focused && (
                <View style={styles.labelContainer}>
                  <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                    Favorites
                  </Text>
                </View>
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
                  size={20} 
                  color={getTabIconColor(focused)}
                  variant={focused ? "Bold" : "Broken"}
                />
              </View>
              {focused && (
                <View style={styles.labelContainer}>
                  <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                    Report
                  </Text>
                </View>
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
                  size={20} 
                  color={getTabIconColor(focused)}
                  variant={focused ? "Bold" : "Broken"}
                />
              </View>
              {focused && (
                <View style={styles.labelContainer}>
                  <Text style={[styles.tabLabel, { color: getTabIconColor(focused) }]}>
                    Settings
                  </Text>
                </View>
              )}
            </View>
          ),
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
  tabItem: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
    height: '100%',
    width: 60,
  },
  iconContainer: {
    width: 38,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  labelContainer: {
    width: '100%',
    overflow: 'visible',
  },
  tabLabel: {
    fontSize: FontSizes.tabLabel,
    fontFamily: 'Nunito-Medium',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: 1,
    width: '100%',
    lineHeight: 12,
    height: 12,
  },
});
