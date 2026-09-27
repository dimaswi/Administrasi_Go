import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ActiveTheme = 'light' | 'dark';

export interface ThemeColors {
  bg: string;
  card: string;
  textMain: string;
  textMuted: string;
  teal: string;
  border: string;
  subtle: string;
  statusOnsiteBg: string;
  statusOnsiteText: string;
  statusLateBg: string;
  statusLateText: string;
}

export const lightColors: ThemeColors = {
  bg: '#F4F6F8',
  card: '#FFFFFF',
  textMain: '#111827',
  textMuted: '#6B7280',
  teal: '#0A7973',
  border: '#E2E8F0',
  subtle: '#F1F5F9',
  statusOnsiteBg: '#DCFCE7',
  statusOnsiteText: '#15803D',
  statusLateBg: '#FEF3C7',
  statusLateText: '#B45309',
};

export const darkColors: ThemeColors = {
  bg: '#0F172A',
  card: '#1E293B',
  textMain: '#F8FAFC',
  textMuted: '#94A3B8',
  teal: '#14B8A6',
  border: '#334155',
  subtle: '#1E293B',
  statusOnsiteBg: '#064E3B',
  statusOnsiteText: '#6EE7B7',
  statusLateBg: '#78350F',
  statusLateText: '#FDE68A',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  activeTheme: ActiveTheme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  setThemeMode: () => {},
  activeTheme: 'light',
  colors: lightColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const deviceScheme = useDeviceColorScheme();
  const activeTheme: ActiveTheme = deviceScheme === 'dark' ? 'dark' : 'light';
  const colors = activeTheme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode: 'system',
        setThemeMode: () => {},
        activeTheme,
        colors,
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);
