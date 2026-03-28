import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { Colors, Radius, Shadow, FontSize } from '../constants/theme';

const DELIVERY_FEE = 4.99;

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart, restaurantName } = useCart();

  const total = subtotal + DELIVERY_FEE;

  const handleClear = () => {
    Alert.alert('Limpar carrinho', 'Deseja remover todos os itens?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: clearCart },
    ]);
  };

  if (items.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Carrinho</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <MaterialIcons name="shopping-bag" size={72} color={Colors.border} />
          <Text style={styles.emptyTitle}>Carrinho vazio</Text>
          <Text style={styles.emptyText}>Adicione itens de um restaurante para continuar</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.88}>
            <Text style={styles.exploreBtnText}>Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Carrinho</Text>
        <TouchableOpacity onPress={handleClear} hitSlop={12}>
          <Text style={styles.clearText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Restaurant */}
      <View style={styles.restaurantRow}>
        <MaterialIcons name="storefront" size={18} color={Colors.primary} />
        <Text style={styles.restaurantName}>{restaurantName}</Text>
      </View>

      {/* Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <Image source={{ uri: item.product.image }} style={styles.itemImage} contentFit="cover" transition={200} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemPrice}>R$ {item.product.price.toFixed(2)}</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, item.quantity <= 1 && { opacity: 0.5 }]}
                  onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                >
                  <MaterialIcons name={item.quantity <= 1 ? 'delete' : 'remove'} size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                >
                  <MaterialIcons name="add" size={16} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.itemTotal}>R$ {(item.product.price * item.quantity).toFixed(2)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.product.id)} hitSlop={12} style={{ paddingLeft: 4 }}>
              <MaterialIcons name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de entrega</Text>
              <Text style={styles.summaryValue}>R$ {DELIVERY_FEE.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>
        }
      />

      {/* Checkout Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
          activeOpacity={0.88}
        >
          <View style={styles.checkoutBadge}>
            <Text style={styles.checkoutBadgeText}>{totalItems}</Text>
          </View>
          <Text style={styles.checkoutText}>Finalizar pedido</Text>
          <Text style={styles.checkoutTotal}>R$ {total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  clearText: { fontSize: 14, color: Colors.error, fontWeight: '600' },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  restaurantName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 12,
    ...Shadow.sm,
  },
  itemImage: { width: 72, height: 72, borderRadius: Radius.sm },
  itemName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: 13, color: Colors.textSecondary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  itemTotal: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginLeft: 'auto' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 16,
    gap: 10,
    marginTop: 4,
    ...Shadow.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 17, fontWeight: '700', color: Colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  footer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    ...Shadow.md,
  },
  checkoutBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  checkoutText: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff', textAlign: 'center' },
  checkoutTotal: { fontSize: 15, fontWeight: '700', color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  exploreBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
