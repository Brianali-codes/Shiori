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
  ImageBackgroundProps,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

// Base themed props interface
export interface ThemedProps {
  lightColor?: string;
  darkColor?: string;
}

// Default theme colors
const defaultColors = {
  light: {
    background: '#FFFFFF',
    text: '#11181C',
    card: '#F1F3F5',
    border: '#E6E8EB',
    primary: '#0a7ea4',
    secondary: '#687076',
    accent: '#889096',
    muted: '#F9F9F9'
  },
  dark: {
    background: '#151718',
    text: '#ECEDEE',
    card: '#1E1F20',
    border: '#2C2D2E',
    primary: '#0a7ea4',
    secondary: '#687076',
    accent: '#9BA1A6',
    muted: '#454545'
  },
  amoled: {
    background: '#000000',
    text: '#FFFFFF',
    card: '#111111',
    border: '#222222',
    primary: '#0a7ea4',
    secondary: '#687076',
    accent: '#9BA1A6',
    muted: '#222222'
  }
};

// ThemedView component
export type ThemedViewProps = ViewProps & ThemedProps;

export function ThemedView({ children, style, lightColor, darkColor }: ThemedViewProps) {
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ThemedText component
export type ThemedTextProps = TextProps & ThemedProps;

export function ThemedText({ children, style }: ThemedTextProps) {
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];

  return (
    <Text
      style={[
        {
          color: colors.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ThemedScrollView component
export type ThemedScrollViewProps = ScrollViewProps & ThemedProps;

export function ThemedScrollView({ children, style }: ThemedScrollViewProps) {
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];

  return (
    <ScrollView
      style={[
        styles.scrollView,
        {
          backgroundColor: colors.background,
        },
        style,
      ]}
    >
      {children}
    </ScrollView>
  );
}

// ThemedPressable component
export type ThemedPressableProps = PressableProps & ThemedProps & {
  backgroundColor?: string;
};

export function ThemedPressable({ style, lightColor, darkColor, backgroundColor, ...otherProps }: ThemedPressableProps) {
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];
  const bgColor = backgroundColor || colors.background;
  
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
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];
  
  return <FlatList style={[{ backgroundColor: colors.background }, style]} {...otherProps} />;
}

// Themed ImageBackground
export type ThemedImageBackgroundProps = ImageBackgroundProps & ThemedProps;

export function ThemedImageBackground({ style, imageStyle, lightColor, darkColor, ...otherProps }: ThemedImageBackgroundProps) {
  const { theme } = useThemeContext();
  const colors = defaultColors[theme];
  
  return <ImageBackground 
    style={[{ backgroundColor: colors.background }, style]} 
    imageStyle={imageStyle}
    {...otherProps} 
  />;
}

// Function to get current theme type
export function useCustomTheme() {
  const { theme } = useThemeContext();
  return theme;
}

// Function to get colors based on current theme
export function useThemeColors() {
  const { theme } = useThemeContext();
  return {
    colors: defaultColors[theme],
    isDark: theme === 'dark' || theme === 'amoled',
    isAmoled: theme === 'amoled'
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
}); 