import { DarkTheme, DefaultTheme, ThemeProvider as ExpoNavThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider as AppThemeProvider, useThemeContext } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function MainContent() {
  const { activeTheme } = useThemeContext();

  const paperTheme = activeTheme === 'dark' ? {
    ...MD3DarkTheme,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#14B8A6',
    },
  } : {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: '#0A7973',
    },
  };

  return (
    <ExpoNavThemeProvider value={activeTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaperProvider theme={paperTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ExpoNavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <MainContent />
    </AppThemeProvider>
  );
}

