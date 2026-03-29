import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.pageBackground}>
      <View style={styles.phoneOuter}>
        <View style={styles.phoneSideBtnLeft} />
        <View style={styles.phoneSideBtnLeft2} />
        <View style={styles.phoneSideBtnRight} />
        <View style={styles.phoneInner}>
          <View style={styles.notchRow}>
            <View style={styles.notch} />
          </View>
          <View style={styles.screen}>
            {children}
          </View>
          <View style={styles.homeBar} />
        </View>
      </View>
    </View>
  );
}

const PHONE_W = 375;
const PHONE_H = 780;

const styles = StyleSheet.create({
  pageBackground: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneOuter: {
    width: PHONE_W + 20,
    height: PHONE_H + 20,
    backgroundColor: '#1c1c1e',
    borderRadius: 52,
    borderWidth: 2,
    borderColor: '#3a3a3c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
  },
  phoneSideBtnLeft: {
    position: 'absolute',
    left: -5,
    top: 120,
    width: 4,
    height: 36,
    backgroundColor: '#3a3a3c',
    borderRadius: 2,
  },
  phoneSideBtnLeft2: {
    position: 'absolute',
    left: -5,
    top: 170,
    width: 4,
    height: 64,
    backgroundColor: '#3a3a3c',
    borderRadius: 2,
  },
  phoneSideBtnRight: {
    position: 'absolute',
    right: -5,
    top: 150,
    width: 4,
    height: 64,
    backgroundColor: '#3a3a3c',
    borderRadius: 2,
  },
  phoneInner: {
    width: PHONE_W,
    height: PHONE_H,
    backgroundColor: '#000',
    borderRadius: 44,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  notchRow: {
    height: 36,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  notch: {
    width: 120,
    height: 28,
    backgroundColor: '#000',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1c1c1e',
  },
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  homeBar: {
    height: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  const content = (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <PushRegistrar />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="splash" />
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
