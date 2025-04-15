import { useTheme } from 'react-native-paper';

interface ThemeColors {
  background: string;
  text: string;
  subtext: string;
  card: string;
  border: string;
}

export const useThemeColors = (): ThemeColors => {
  const theme = useTheme();
  
  return {
    background: theme.colors.background,
    text: theme.colors.onBackground,
    subtext: theme.colors.onSurfaceVariant,
    card: theme.colors.surface,
    border: theme.colors.outline,
  };
}; 