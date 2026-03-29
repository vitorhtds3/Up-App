import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, FontSize, Shadow } from '../../constants/theme';
import { fetchUserOrders, subscribeToOrder } from '../../services/orderService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'expo-router';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string; step: number }> = {
  pending: { label: 'Aguardando confirmação', color: Colors.warning, icon: 'schedule', step: 1 },
  accepted: { label: 'Pedido confirmado', color: Colors.info, icon: 'check-circle', step: 2 },
  preparing: { label: 'Em preparo', color: Colors.primary, icon: 'restaurant', step: 2 },
  delivering: { label: 'Saiu para entrega', color: '#9B59B6', icon: 'delivery-dining', step: 3 },
  delivered: { label: 'Entregue', color: Colors.success, icon: 'done-all', step: 4 },
  cancelled: { label: 'Cancelado', color: Colors.error, icon: 'cancel', step: 0 },
};

function StatusTimeline({ status }: { status: string }) {
  const steps = ['pending', 'accepted', 'delivering', 'delivered'];
  const currentStep = STATUS_CONFIG[status]?.step || 0;

  if (status === 'cancelled') {
    return (
      <View style={timelineStyles.cancelled}>
        <MaterialIcons name="cancel" size={14} color={Colors.error} />
        <Text style={[timelineStyles.cancelledText]}>Pedido cancelado</Text>
      </View>
    );
  }

  return (
    <View style={timelineStyles.container}>
      {steps.map((s, i) => {
        const cfg = STATUS_CONFIG[s];
        const done = currentStep > cfg.step || (currentStep === cfg.step && status === s);
        const active = status === s;
        return (
          <React.Fragment key={s}>
            <View style={[timelineStyles.step, done && timelineStyles.stepDone, active && { borderColor: Colors.primary }]}>
              <MaterialIcons
                name={cfg.icon as any}
                size={14}
                color={done ? '#fff' : Colors.textLight}
              />
            </View>
            {i < steps.length - 1 ? (
              <View style={[timelineStyles.line, done && timelineStyles.lineDone]} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  step: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  line: { flex: 1, height: 2, backgroundColor: Colors.border },
  lineDone: { backgroundColor: Colors.primary },
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 },
  cancelledText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
});

function OrderCard({ order, onPress, onRepeat }: { order: any; onPress: () => void; onRepeat: () => void }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const date = new Date(order.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.restaurantName}>{order.restaurant_name}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
          <MaterialIcons name={cfg.icon as any} size={14} color={cfg.color} />
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <StatusTimeline status={order.status} />

      {order.order_items && order.order_items.length > 0 ? (
        <View style={styles.items}>
          {order.order_items.slice(0, 2).map((item: any, idx: number) => (
            <Text key={idx} style={styles.item}>
              {item.quantity}x {item.product_name}
            </Text>
          ))}
          {order.order_items.length > 2 ? (
            <Text style={styles.more}>+{order.order_items.length - 2} itens</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.total}>R$ {order.total?.toFixed(2)}</Text>
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation?.(); onRepeat(); }}
          activeOpacity={0.75}
          style={styles.repeatBtn}
        >
          <MaterialIcons name="replay" size={14} color={Colors.primary} />
          <Text style={styles.repeat}>Repetir pedido</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    fetchUserOrders(user.id).then((data) => {
      setOrders(data as any[]);
      setLoading(false);
    });
  }, [user]);

  // Real-time order status updates
  useEffect(() => {
    if (!user || orders.length === 0) return;
    const channels = orders
      .filter((o) => !['delivered', 'cancelled'].includes(o.status))
      .map((o) =>
        subscribeToOrder(o.id, (updated) => {
          setOrders((prev) =>
            prev.map((order) => order.id === updated.id ? { ...order, ...updated } : order)
          );
        })
      );
    return () => channels.forEach((ch) => ch.unsubscribe());
  }, [user, orders.length]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        <Text style={styles.headerSub}>Acompanhe seus pedidos em tempo real</Text>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <MaterialIcons name="receipt-long" size={64} color={Colors.border} />
          <Text style={styles.emptyTitle}>Nenhum pedido ainda</Text>
          <Text style={styles.emptyText}>Faça seu primeiro pedido e acompanhe aqui!</Text>
          <TouchableOpacity style={styles.startBtn} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.startBtnText}>Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => item.restaurant_id && router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurant_id } })}
              onRepeat={() => item.restaurant_id && router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurant_id } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 16, ...Shadow.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  restaurantName: { fontSize: 16, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  items: { marginTop: 14, gap: 2 },
  item: { fontSize: 13, color: Colors.textSecondary },
  more: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  total: { fontSize: 16, fontWeight: '700', color: Colors.text },
  repeatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  repeat: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  startBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
