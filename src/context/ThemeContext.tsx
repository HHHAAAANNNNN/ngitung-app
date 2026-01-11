// src/context/ThemeContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceDark: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  outline: string;
  onBackground: string;
  onSurface: string;
  glass: string;
  glassBorder: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const darkTheme: ThemeColors = {
  primary: '#A78BFA',
  secondary: '#34D399',
  accent: '#F472B6',
  background: '#0F0A1F',
  surface: 'rgba(255, 255, 255, 0.1)',
  surfaceDark: 'rgba(30, 27, 75, 0.6)',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.2)',
  error: '#EF4444',
  success: '#10B981',
  outline: '#6B7280',
  onBackground: '#F3F4F6',
  onSurface: '#E5E7EB',
  glass: 'rgba(255, 255, 255, 0.1)',
  glassBorder: 'rgba(255, 255, 255, 0.2)',
};

const lightTheme: ThemeColors = {
  primary: '#8B5CF6',
  secondary: '#10B981',
  accent: '#EC4899',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceDark: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#059669',
  outline: '#9CA3AF',
  onBackground: '#1F2937',
  onSurface: '#374151',
  glass: 'rgba(0, 0, 0, 0.05)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('dark');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setMode(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    try {
      await AsyncStorage.setItem('app_theme', newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
