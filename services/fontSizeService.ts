import { FontSizes } from '@/constants/FontSizes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Font scaling factors for different size options
const FONT_SCALE = {
  small: 0.85,
  medium: 1.0,
  large: 1.2
};

// Default font size option
const DEFAULT_FONT_SIZE = 'medium';

// Original font sizes used for scaling reference
const ORIGINAL_FONT_SIZES = { ...FontSizes };

// Current font size option
let currentFontSize = DEFAULT_FONT_SIZE;

/**
 * Gets the font size scale factor
 */
export const getFontScale = (): number => {
  return FONT_SCALE[currentFontSize as keyof typeof FONT_SCALE] || FONT_SCALE.medium;
};

/**
 * Initializes the font size service by loading the saved preference
 * Note: This is still needed for backward compatibility and initial loading
 */
export const initFontSize = async (): Promise<void> => {
  try {
    const savedSize = await AsyncStorage.getItem('fontSizeOption');
    if (savedSize && Object.keys(FONT_SCALE).includes(savedSize)) {
      currentFontSize = savedSize;
      // We don't call applyFontScale here as the context will handle this
    }
  } catch (error) {
    console.error('Failed to load font size setting:', error);
  }
};

/**
 * Sets a new font size option
 * This is now handled by the FontSizeContext
 * Kept for backward compatibility with any code that might call it directly
 */
export const setFontSize = async (sizeOption: 'small' | 'medium' | 'large'): Promise<void> => {
  if (sizeOption === currentFontSize) return;
  
  try {
    currentFontSize = sizeOption;
    await AsyncStorage.setItem('fontSizeOption', sizeOption);
    // We don't call applyFontScale as the context will handle updating the UI
  } catch (error) {
    console.error('Failed to save font size setting:', error);
  }
};

/**
 * Applies the current font scale to all font sizes
 * This is now primarily handled by the FontSizeContext
 * Kept for backward compatibility with any code that might call it directly
 */
export const applyFontScale = (): void => {
  const scale = getFontScale();
  
  // Update all font sizes with the current scale
  Object.keys(ORIGINAL_FONT_SIZES).forEach(key => {
    const originalSize = ORIGINAL_FONT_SIZES[key as keyof typeof ORIGINAL_FONT_SIZES];
    FontSizes[key as keyof typeof FontSizes] = Math.round(originalSize * scale);
  });
};

/**
 * Gets the current font size option
 */
export const getCurrentFontSize = (): string => {
  return currentFontSize;
}; 