import { Platform } from 'react-native';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  return colorScheme ?? 'light';
}
