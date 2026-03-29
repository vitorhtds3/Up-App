import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useCart } from '../../hooks/useCart';
import { Colors } from '../../constants/theme';

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { totalItems } = useCart();
  return (
    <View style={iconStyles.wrap}>
      <MaterialIcons name="receipt-long" size={22} color={color} />
      {totalItems > 0 ? (
        <View style={[iconStyles.badge, focused && iconStyles.badgeFocused]}>
          <Text style={iconStyles.badgeText}>{totalItems > 9 ? '9+' : totalItems}</Text>
        </View>
      ) : null}
    </View>
  );
}

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  return (
    <View style={iconStyles.wrap}>
      <MaterialIcons name={name} size={22} color={color} />
      {focused && <View style={iconStyles.dot} />}
    </View>
  );
}

const iconStyles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', width: 40, height: 34 },
  dot: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeFocused: {
    backgroundColor: Colors.primary,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pb = Platform.select({ ios: insets.bottom, android: 4, default: 4 });

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 54 + pb,
          paddingTop: 6,
          paddingBottom: pb + 4,
          paddingHorizontal: 8,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
          letterSpacing: 0.1,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, string> = {
            index: 'home',
            search: 'search',
            orders: 'receipt-long',
            profile: 'person',
          };
          if (route.name === 'orders') {
            return <CartTabIcon color={color} focused={focused} />;
          }
          return <TabIcon name={icons[route.name] ?? 'circle'} color={color} focused={focused} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Início' }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar' }} />
      <Tabs.Screen name="orders" options={{ title: 'Pedidos' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
