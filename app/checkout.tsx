import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../hooks/useCart';
import { createOrder } from '../services/orderService';
import { supabase } from '../lib/supabase';
import { Colors, Radius, Shadow, FontSize, Fonts } from '../constants/theme';

const PAYMENT_OPTIONS = [
  { id: 'pix', label: 'Pix', icon: 'qr-code-2' },
  { id: 'credit', label: 'Crédito', icon: 'credit-card' },
  { id: 'debit', label: 'Débito', icon: 'credit-card' },
  { id: 'cash', label: 'Dinheiro', icon: 'payments' },
];

const DELIVERY_FEE = 4.99;

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, subtotal, restaurantId, restaurantName, clearCart } = useCart();

  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('pix');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const total = subtotal + DELIVERY_FEE;

  const handleOrder = async () => {
    if (!address.trim()) {
      Alert.alert('Endereço obrigatório', 'Por favor, informe o endereço de entrega.');
      return;
    }
    if (!restaurantId) return;

    // Ensure we have a valid authenticated user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      Alert.alert('Não autenticado', 'Faça login para continuar.');
      router.replace('/login');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.price,
        total_price: i.product.price * i.quantity,
      }));

      await createOrder({
        user_id: currentUser.id,
        restaurant_id: restaurantId,
        restaurant_name: restaurantName || '',
        items: orderItems,
        subtotal,
        delivery_fee: DELIVERY_FEE,
        total,
        delivery_address: address.trim(),
        payment_method: payment,
      });

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      Alert.alert('Erro ao criar pedido', err?.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.success, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check" size={48} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Pedido realizado!</Text>
        <Text style={styles.successSubtitle}>
          Seu pedido foi enviado para {restaurantName}.{'\n'}
          Acompanhe o status em tempo real.
        </Text>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => router.replace('/(tabs)/orders')}
          activeOpacity={0.88}
        >
          <Text style={styles.trackBtnText}>Acompanhar pedido</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={{ marginTop: 12 }}>
          <Text style={styles.homeLink}>Voltar para o início</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/cart')} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finalizar pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="place" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Endereço de entrega</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            placeholder="Rua, número, bairro, complemento..."
            placeholderTextColor={Colors.textLight}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Payment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="payment" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Forma de pagamento</Text>
          </View>
          <View style={styles.paymentGrid}>
            {PAYMENT_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.paymentOption, payment === p.id && styles.paymentOptionActive]}
                onPress={() => setPayment(p.id)}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={p.icon as any}
                  size={22}
                  color={payment === p.id ? '#fff' : Colors.textSecondary}
                />
                <Text style={[styles.paymentLabel, payment === p.id && styles.paymentLabelActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="receipt" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Resumo do pedido</Text>
          </View>
          <View style={{ gap: 8 }}>
            {items.map((item) => (
              <View key={item.product.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName}>
                  {item.quantity}x {item.product.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  R$ {(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>R$ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Entrega</Text>
              <Text style={styles.summaryValue}>R$ {DELIVERY_FEE.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryItem, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.orderBtn, loading && { opacity: 0.7 }]}
          onPress={handleOrder}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.orderBtnText}>Confirmar pedido</Text>
              <Text style={styles.orderBtnTotal}>R$ {total.toFixed(2)}</Text>
            </>
          )}
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
  headerTitle: { fontSize: 18, fontFamily: Fonts.bold, color: Colors.text },
  section: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, ...Shadow.sm, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bold, color: Colors.text },
  addressInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surface,
    minHeight: 80,
  },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentOption: {
    flex: 1,
    minWidth: '40%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
  },
  paymentOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  paymentLabel: { fontSize: 13, fontFamily: Fonts.semiBold, color: Colors.textSecondary },
  paymentLabelActive: { color: '#fff' },
  summaryItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItemName: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.text, flex: 1 },
  summaryItemPrice: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.text },
  summaryLabel: { fontSize: 14, fontFamily: Fonts.regular, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  totalRow: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 10, marginTop: 2 },
  totalLabel: { fontSize: 17, fontFamily: Fonts.bold, color: Colors.text },
  totalValue: { fontSize: 20, fontFamily: Fonts.extraBold, color: Colors.primary },
  footer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  orderBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...Shadow.md,
  },
  orderBtnText: { fontSize: 16, fontFamily: Fonts.bold, color: '#fff', flex: 1, textAlign: 'center' },
  orderBtnTotal: { fontSize: 15, fontFamily: Fonts.bold, color: 'rgba(255,255,255,0.9)' },
  // Success
  success: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 28, fontFamily: Fonts.extraBold, color: Colors.text },
  successSubtitle: { fontSize: 15, fontFamily: Fonts.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  trackBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 32,
    paddingVertical: 16,
    marginTop: 8,
    ...Shadow.md,
  },
  trackBtnText: { color: '#fff', fontSize: 16, fontFamily: Fonts.bold },
  homeLink: { fontSize: 14, fontFamily: Fonts.semiBold, color: Colors.primary, padding: 8 },
});
