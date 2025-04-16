import React from 'react';
import { Heart } from 'iconsax-react-nativejs';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

interface HeartIconProps {
  size?: number;
  color?: string;
  isFilled?: boolean;
  onPress?: () => void;
  withBackground?: boolean;
  style?: any;
}

/**
 * A custom Heart icon component that uses Iconsax icons
 * This prevents "heart is not a valid icon name for family material" warnings
 */
export const HeartIcon: React.FC<HeartIconProps> = ({
  size = 24, 
  color = '#FFFFFF', 
  isFilled = false, 
  onPress, 
  withBackground = false,
  style
}) => {
  const IconComponent = (
    <Heart
      size={size}
      color={color}
      variant={isFilled ? "Bold" : "Linear"}
      style={style}
    />
  );

  // If no onPress handler is provided, just return the icon
  if (!onPress) {
    return withBackground ? (
      <View style={styles.blurContainer}>
        <BlurView intensity={25} tint="dark" style={styles.blurView}>
          {IconComponent}
        </BlurView>
      </View>
    ) : IconComponent;
  }

  // Otherwise, wrap it in a TouchableOpacity
  return (
    <TouchableOpacity onPress={onPress}>
      {withBackground ? (
        <BlurView intensity={25} tint="dark" style={styles.blurView}>
          {IconComponent}
        </BlurView>
      ) : IconComponent}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  blurView: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 