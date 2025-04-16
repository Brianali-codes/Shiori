import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontSizes as OriginalFontSizes } from '@/constants/FontSizes';
import { applyFontScale, getFontScale } from '@/services/fontSizeService';

// Font scaling factors for different size options
const FONT_SCALE = {
  small: 0.85,
  medium: 1.0,
  large: 1.2
};

// Define the context type
interface FontSizeContextType {
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => Promise<void>;
  fontSizes: typeof OriginalFontSizes;
  refreshFontSizes: () => void;
}

// Create the context
const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

// Provider component
export const FontSizeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [fontSizes, setFontSizes] = useState({...OriginalFontSizes});

  // Load font size from storage on mount
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('fontSizeOption');
        if (savedSize && (savedSize === 'small' || savedSize === 'medium' || savedSize === 'large')) {
          setFontSizeState(savedSize as 'small' | 'medium' | 'large');
        }
      } catch (error) {
        console.error('Failed to load font size setting:', error);
      }
    };
    loadFontSize();
  }, []);

  // Apply font scaling whenever fontSize changes
  useEffect(() => {
    applyScaleToFontSizes();
  }, [fontSize]);

  // Method to scale and update all font sizes
  const applyScaleToFontSizes = () => {
    const scale = FONT_SCALE[fontSize];
    const updatedFontSizes = {...OriginalFontSizes};
    
    // Update all font sizes with the current scale
    Object.keys(updatedFontSizes).forEach(key => {
      const originalSize = OriginalFontSizes[key as keyof typeof OriginalFontSizes];
      updatedFontSizes[key as keyof typeof OriginalFontSizes] = Math.round(originalSize * scale);
    });
    
    setFontSizes(updatedFontSizes);
  };

  // Set font size and save to storage
  const setFontSize = async (newSize: 'small' | 'medium' | 'large') => {
    try {
      await AsyncStorage.setItem('fontSizeOption', newSize);
      setFontSizeState(newSize);
    } catch (error) {
      console.error('Failed to save font size setting:', error);
    }
  };

  // Method to refresh font sizes (can be called to force update)
  const refreshFontSizes = () => {
    applyScaleToFontSizes();
  };

  return (
    <FontSizeContext.Provider value={{ 
      fontSize, 
      setFontSize, 
      fontSizes,
      refreshFontSizes
    }}>
      {children}
    </FontSizeContext.Provider>
  );
};

// Custom hook to use the font size context
export const useFontSizeContext = () => {
  const context = useContext(FontSizeContext);
  if (context === undefined) {
    throw new Error('useFontSizeContext must be used within a FontSizeProvider');
  }
  return context;
}; 