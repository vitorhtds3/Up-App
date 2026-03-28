import { Stack } from 'expo-router';
import { useEffect } from 'react';
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

export default function RootLayout() {
  return (
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
}
