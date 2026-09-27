import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  View, 
  Text, 
  StyleSheet, 
  useColorScheme
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CustomAlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export default function CustomAlert({ 
  visible, 
  type, 
  title, 
  message, 
  onClose
}: CustomAlertProps) {
  const isDark = useColorScheme() === 'dark';
  const translateY = useRef(new Animated.Value(-150)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: insets.top > 0 ? insets.top + 10 : 40,
        useNativeDriver: true,
        tension: 80,
        friction: 12
      }).start();

      // Auto dismiss after 3 seconds
      const timer = setTimeout(() => {
        closeToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const closeToast = () => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onClose();
    });
  };

  const getConfig = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#10B981', bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5' };
      case 'error':
        return { icon: 'close-circle', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' };
      case 'warning':
        return { icon: 'warning', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7' };
      case 'info':
      default:
        return { icon: 'information-circle', color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE' };
    }
  };

  const config = getConfig();
  
  const theme = {
    cardBg: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#475569',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        { 
          transform: [{ translateY }],
          backgroundColor: theme.cardBg,
          borderColor: theme.border,
        }
      ]}
      pointerEvents="none"
    >
      <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon as any} size={22} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    padding: 16,

    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,

    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  }
});
