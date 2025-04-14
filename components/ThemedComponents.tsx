import React from 'react';
import { 
  Text, 
  TextProps, 
  View, 
  ViewProps, 
  ScrollView, 
  ScrollViewProps,
  Pressable,
  PressableProps,
  FlatList,
  FlatListProps,
  ImageBackground,
  ImageBackgroundProps
} from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useThemeContext } from '../contexts/ThemeContext';

// Base themed props interface
export interface ThemedProps {
  lightColor?: string;
  darkColor?: string;
}

// ThemedView component
export type ThemedViewProps = ViewProps & ThemedProps;

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

// ThemedText component
export type ThemedTextProps = TextProps & ThemedProps;

export function ThemedText({ style, lightColor, darkColor, ...otherProps }: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return <Text style={[{ color }, style]} {...otherProps} />;
}

// ThemedScrollView component
export type ThemedScrollViewProps = ScrollViewProps & ThemedProps;

export function ThemedScrollView({ style, lightColor, darkColor, ...otherProps }: ThemedScrollViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <ScrollView style={[{ backgroundColor }, style]} {...otherProps} />;
}

// ThemedPressable component
export type ThemedPressableProps = PressableProps & ThemedProps & {
  backgroundColor?: string;
};

export function ThemedPressable({ style, lightColor, darkColor, backgroundColor, ...otherProps }: ThemedPressableProps) {
  const bgColor = backgroundColor || useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <Pressable 
    style={(state) => [
      { backgroundColor: bgColor, opacity: state.pressed ? 0.8 : 1 },
      typeof style === 'function' ? style(state) : style
    ]} 
    {...otherProps} 
  />;
}

// Themed FlatList
export type ThemedFlatListProps<T> = FlatListProps<T> & ThemedProps;

export function ThemedFlatList<T>({ style, lightColor, darkColor, ...otherProps }: ThemedFlatListProps<T>) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <FlatList style={[{ backgroundColor }, style]} {...otherProps} />;
}

// Themed ImageBackground
export type ThemedImageBackgroundProps = ImageBackgroundProps & ThemedProps;

export function ThemedImageBackground({ style, imageStyle, lightColor, darkColor, ...otherProps }: ThemedImageBackgroundProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  return <ImageBackground 
    style={[{ backgroundColor }, style]} 
    imageStyle={imageStyle}
    {...otherProps} 
  />;
}

// Function to get current theme type
export function useTheme() {
  const { theme } = useThemeContext();
  return theme;
}

// Function to get colors based on current theme
export function useThemeColors() {
  const { theme } = useThemeContext();
  return {
    colors: theme === 'dark' ? {
      background: '#151718',
      text: '#ECEDEE',
      card: '#1E1F20',
      border: '#2C2D2E',
      primary: '#0a7ea4',
      secondary: '#687076',
      accent: '#9BA1A6',
      muted: '#454545'
    } : {
      background: '#FFFFFF',
      text: '#11181C',
      card: '#F1F3F5',
      border: '#E6E8EB',
      primary: '#0a7ea4',
      secondary: '#687076',
      accent: '#889096',
      muted: '#F9F9F9'
    },
    isDark: theme === 'dark'
  };
} 