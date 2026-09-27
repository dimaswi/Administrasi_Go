import React from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/context/ThemeContext';

const TAB_ITEMS: Array<{ name: string; label: string; icon: any; iconOutline: any; badge?: string }> = [
  { name: 'home', label: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'document', label: 'Rapat', icon: 'calendar-number', iconOutline: 'calendar-number-outline' },
  { name: 'action', label: 'Ambil Gambar', icon: 'camera', iconOutline: 'camera-outline' },
  { name: 'inbox', label: 'Inbox', icon: 'mail', iconOutline: 'mail-outline', badge: 'Dev' },
  { name: 'profile', label: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, activeTheme } = useThemeContext();
  const [isFakeGPS, setIsFakeGPS] = React.useState(false);

  React.useEffect(() => {
    const { DeviceEventEmitter } = require('react-native');
    const sub = DeviceEventEmitter.addListener('SET_FAKE_GPS_STATUS', (data: any) => {
      setIsFakeGPS(!!data?.isFakeGPS);
    });
    return () => {
      sub.remove();
    };
  }, []);

  const containerBg = colors.card;
  const borderTopColor = colors.border;
  const activeIconBg = activeTheme === 'dark' ? 'rgba(20, 184, 166, 0.2)' : '#CCFBF1';
  const scanBorderColor = activeTheme === 'dark' ? '#0F172A' : '#FFFFFF';

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: containerBg,
        borderTopColor: borderTopColor,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 12
      }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const tab = TAB_ITEMS[index];
        const isScan = route.name === 'action';
        const isBlocked = isScan && focused && isFakeGPS;

        const onPress = () => {
          if (isScan && focused) {
            const { DeviceEventEmitter } = require('react-native');
            if (isFakeGPS) {
              DeviceEventEmitter.emit('SHOW_FAKE_GPS_ALERT');
              return;
            }
            DeviceEventEmitter.emit('ACTION_TAKE_PHOTO');
            return;
          }

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isScan) {
          return (
            <View key={route.key} style={styles.scanWrapper}>
              <TouchableOpacity
                activeOpacity={isBlocked ? 0.95 : 0.85}
                onPress={onPress}
                style={[
                  styles.scanButton,
                  {
                    backgroundColor: isBlocked ? '#EF4444' : colors.teal,
                    borderColor: isBlocked ? 'rgba(239, 68, 68, 0.45)' : scanBorderColor,
                  }
                ]}
              >
                <Ionicons
                  name={isBlocked ? "alert-circle" : "camera"}
                  size={28}
                  color="#fff"
                />
              </TouchableOpacity>
              <Text
                style={[
                  styles.scanLabel,
                  {
                    color: isBlocked ? '#EF4444' : colors.teal,
                    fontWeight: '800'
                  }
                ]}
              >
                {isBlocked ? 'Fake GPS!' : 'Ambil Gambar'}
              </Text>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.7}
            style={styles.tabItem}
          >
            <View style={[styles.iconBg, focused && { backgroundColor: activeIconBg }]}>
              <Ionicons
                name={(focused ? tab.icon : tab.iconOutline) as any}
                size={22}
                color={focused ? colors.teal : colors.textMuted}
              />
              {tab.badge ? (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[
              styles.label,
              { color: colors.textMuted },
              focused && { color: colors.teal }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="document" />
      <Tabs.Screen name="action" />
      <Tabs.Screen name="inbox" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconBg: {
    width: 42,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // ----- Scan FAB (center special button) -----
  scanWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -32, // More lift
    paddingBottom: 4,
  },
  scanButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    marginBottom: 2,
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: -6,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
