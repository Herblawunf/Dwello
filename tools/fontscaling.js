import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Base width for scaling (iPhone 6/7/8)
const BASE_WIDTH = 375;

export const responsiveFontSize = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
};
