import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { registerPushToken } from '../services/notificationService';
import { useAuth } from '../hooks/useAuth';

function PushRegistrar() {
  const { user } = useAuth();
  useEffect(() => {
    if (user) {
      registerPushToken();
    }
  }, [user?.id]);
  return null;
}

function NavigationGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const isPublicRoute =
      segments.length === 0 ||
      segments[0] === 'login' ||
      segments[0] === 'register' ||
      segments[0] === 'index';
    if (!user && !isPublicRoute) {
      router.replace('/login');
    }
  }, [user, loading, segments]);

  return null;
}

function StatusBar() {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  return (
    <View style={frameStyles.statusBar}>
      <Text style={frameStyles.statusTime}>{hh}:{mm}</Text>
      <View style={frameStyles.statusIcons}>
        <MaterialIcons name="signal-cellular-alt" size={14} color="#fff" />
        <MaterialIcons name="wifi" size={14} color="#fff" />
        <View style={frameStyles.battery}>
          <View style={frameStyles.batteryFill} />
          <View style={frameStyles.batteryTip} />
        </View>
      </View>
    </View>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={frameStyles.pageBackground}>
      <View style={frameStyles.phoneOuter}>
        <View style={frameStyles.phoneSideBtnLeft} />
        <View style={frameStyles.phoneSideBtnLeft2} />
        <View style={frameStyles.phoneSideBtnRight} />
        <View style={frameStyles.phoneInner}>
          <View style={frameStyles.dynamicIslandRow}>
            <View style={frameStyles.dynamicIsland} />
          </View>
          <StatusBar />
          <View style={frameStyles.screen}>
            {children}
          </View>
          <View style={frameStyles.homeBarRow}>
            <View style={frameStyles.homeBar} />
          </View>
        </View>
      </View>
    </View>
  );
}

const PHONE_W = 375;
const PHONE_H = 768;

const frameStyles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneOuter: {
    width: PHONE_W + 16,
    height: PHONE_H + 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: '#3A3A3C',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.7,
    shadowRadius: 48,
  },
  phoneSideBtnLeft: {
    position: 'absolute',
    left: -5,
    top: 130,
    width: 3,
    height: 32,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  phoneSideBtnLeft2: {
    position: 'absolute',
    left: -5,
    top: 176,
    width: 3,
    height: 64,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  phoneSideBtnRight: {
    position: 'absolute',
    right: -5,
    top: 160,
    width: 3,
    height: 64,
    backgroundColor: '#3A3A3C',
    borderRadius: 2,
  },
  phoneInner: {
    width: PHONE_W,
    height: PHONE_H,
    backgroundColor: '#000',
    borderRadius: 48,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  dynamicIslandRow: {
    height: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  dynamicIsland: {
    width: 120,
    height: 34,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#222',
  },
  statusBar: {
    height: 28,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  battery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryFill: {
    width: 20,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  batteryTip: {
    width: 2,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginLeft: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  homeBarRow: {
    height: 30,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBar: {
    width: 130,
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    opacity: 0.3,
  },
});

export default function RootLayout() {
  const content = (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <PushRegistrar />
          <NavigationGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="restaurant/[id]"
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="cart"
              options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            <Stack.Screen
              name="checkout"
              options={{ headerShown: false, animation: 'slide_from_right' }}
            />
          </Stack>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <PhoneFrame>
        {content}
      </PhoneFrame>
    );
  }

  return content;
}
