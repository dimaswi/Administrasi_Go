import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  PanResponder,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollViewProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../context/ThemeContext';

interface CustomRefreshScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 65;

export default function CustomRefreshScrollView({
  refreshing,
  onRefresh,
  children,
  style,
  contentContainerStyle,
  ...restProps
}: CustomRefreshScrollViewProps) {
  const { colors, activeTheme } = useThemeContext();
  const [isReadyToRelease, setIsReadyToRelease] = useState(false);

  const scrollYRef = useRef(0);
  const isRefreshingRef = useRef(refreshing);
  isRefreshingRef.current = refreshing;

  // Animated values
  const pullAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Rotation loop & page position during refreshing
  useEffect(() => {
    let loopAnimation: Animated.CompositeAnimation | null = null;

    if (refreshing) {
      rotateAnim.setValue(0);
      loopAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      );
      loopAnimation.start();

      Animated.spring(pullAnim, {
        toValue: PULL_THRESHOLD,
        friction: 7,
        tension: 40,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(pullAnim, {
        toValue: 0,
        duration: 250,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        setIsReadyToRelease(false);
      });
    }

    return () => {
      if (loopAnimation) loopAnimation.stop();
    };
  }, [refreshing]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const isAtTop = scrollYRef.current <= 5;
        const isPullingDown = gestureState.dy > 8 && Math.abs(gestureState.dx) < gestureState.dy;
        return isAtTop && isPullingDown && !isRefreshingRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isRefreshingRef.current) return;
        const pull = Math.max(0, Math.min(gestureState.dy * 0.45, 90));
        pullAnim.setValue(pull);
        setIsReadyToRelease(pull >= PULL_THRESHOLD);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isRefreshingRef.current) return;
        const pull = Math.max(0, Math.min(gestureState.dy * 0.45, 90));
        if (pull >= PULL_THRESHOLD) {
          Animated.spring(pullAnim, {
            toValue: PULL_THRESHOLD,
            friction: 7,
            tension: 40,
            useNativeDriver: false,
          }).start();
          onRefresh();
        } else {
          Animated.spring(pullAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: false,
          }).start(() => {
            setIsReadyToRelease(false);
          });
        }
      },
      onPanResponderTerminate: () => {
        if (!isRefreshingRef.current) {
          Animated.spring(pullAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: false,
          }).start(() => {
            setIsReadyToRelease(false);
          });
        }
      },
    })
  ).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    if (restProps.onScroll) {
      restProps.onScroll(e);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pullSpin = pullAnim.interpolate({
    inputRange: [0, PULL_THRESHOLD],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'clamp',
  });

  const bannerOpacity = pullAnim.interpolate({
    inputRange: [0, 15, PULL_THRESHOLD],
    outputRange: [0, 0.7, 1],
    extrapolate: 'clamp',
  });

  const bannerScale = pullAnim.interpolate({
    inputRange: [0, PULL_THRESHOLD],
    outputRange: [0.8, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.bg }]} {...panResponder.panHandlers}>
      {/* Animated Refresh Banner (Positioned at top) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.floatingBannerContainer,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }],
          },
        ]}
      >
        <LinearGradient
          colors={activeTheme === 'dark' ? ['#1E293B', '#14B8A622'] : ['#FFFFFF', '#CCFBF1EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.pillCard, { borderColor: colors.border }]}
        >
          {refreshing ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons name="sparkles" size={20} color={colors.teal} />
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ rotate: pullSpin }] }}>
              <Ionicons
                name={isReadyToRelease ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={20}
                color={isReadyToRelease ? colors.teal : colors.textMuted}
              />
            </Animated.View>
          )}

          <Text style={[styles.bannerText, { color: colors.textMain }]}>
            {refreshing
              ? 'Memperbarui data...'
              : isReadyToRelease
              ? 'Lepaskan untuk memperbarui'
              : 'Tarik kebawah untuk refresh'}
          </Text>
        </LinearGradient>
      </Animated.View>

      {/* Entire Page Body Scrolls/Translates Down Dynamically */}
      <Animated.View style={{ flex: 1, transform: [{ translateY: pullAnim }] }}>
        <ScrollView
          {...restProps}
          style={[style, { flex: 1 }]}
          contentContainerStyle={contentContainerStyle}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
        >
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  floatingBannerContainer: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
