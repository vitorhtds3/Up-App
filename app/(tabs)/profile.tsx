import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Radius, Shadow, FontSize } from '../../constants/theme';
import {
  fetchUserProfile,
  fetchOrdersCount,
  fetchFavoritesCount,
  fetchReviewsCount,
  fetchNotifications,
  fetchAddresses,
  fetchPaymentMethods,
  fetchOrderHistory,
  fetchFavorites,
  subscribeToNotifications,
  markNotificationRead,
  type UserProfile,
  type Notification,
  type Address,
  type PaymentMethod,
  type OrderHistory,
  type FavoriteRestaurant,
} from '../../services/profileService';

// ─── Status helpers ────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Aguardando',  color: '#F2994A', icon: 'schedule' },
  accepted:   { label: 'Confirmado', color: '#2F80ED', icon: 'check-circle' },
  preparing:  { label: 'Preparando', color: '#9B51E0', icon: 'restaurant' },
  delivering: { label: 'A caminho',  color: '#F05A28', icon: 'delivery-dining' },
  delivered:  { label: 'Entregue',   color: '#27AE60', icon: 'done-all' },
  cancelled:  { label: 'Cancelado',  color: '#EB5757', icon: 'cancel' },
};
function getStatus(s: string) {
  return STATUS_MAP[s] || { label: s, color: Colors.textLight, icon: 'info' };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Modals ────────────────────────────────────────────────────────
function SheetModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={sheetStyles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={sheetStyles.sheet}>
        <View style={sheetStyles.handle} />
        <View style={sheetStyles.titleRow}>
          <Text style={sheetStyles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 32,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 17, fontWeight: '700', color: Colors.text },
});

// Notifications Modal
function NotificationsModal({
  visible,
  notifications,
  onClose,
  onRead,
}: {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onRead: (id: string) => void;
}) {
  return (
    <SheetModal visible={visible} title="Notificações" onClose={onClose}>
      {notifications.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <MaterialIcons name="notifications-none" size={52} color={Colors.border} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Nenhuma notificação</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[notifStyles.item, !item.read && notifStyles.unread]}
              onPress={() => onRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={[notifStyles.dot, { backgroundColor: item.read ? Colors.border : Colors.primary }]} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={notifStyles.notifTitle}>{item.title}</Text>
                <Text style={notifStyles.notifMsg}>{item.message}</Text>
                <Text style={notifStyles.notifDate}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SheetModal>
  );
}

const notifStyles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, alignItems: 'flex-start' },
  unread: { backgroundColor: Colors.primary + '0D', borderLeftWidth: 3, borderLeftColor: Colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  notifMsg: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  notifDate: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
});

// Addresses Modal
function AddressesModal({ visible, addresses, onClose }: { visible: boolean; addresses: Address[]; onClose: () => void }) {
  return (
    <SheetModal visible={visible} title="Meus Endereços" onClose={onClose}>
      {addresses.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <MaterialIcons name="place" size={52} color={Colors.border} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Nenhum endereço cadastrado</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}
          renderItem={({ item }) => (
            <View style={addrStyles.card}>
              <View style={addrStyles.iconWrap}>
                <MaterialIcons name="place" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={addrStyles.street}>{item.street}</Text>
                <Text style={addrStyles.city}>{item.city}{item.postal_code ? ` • ${item.postal_code}` : ''}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SheetModal>
  );
}

const addrStyles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  street: { fontSize: 14, fontWeight: '600', color: Colors.text },
  city: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

// Payment Methods Modal
function PaymentsModal({ visible, payments, onClose }: { visible: boolean; payments: PaymentMethod[]; onClose: () => void }) {
  const paymentIcon = (type: string) => {
    if (type === 'credit_card' || type === 'debit_card') return 'credit-card';
    if (type === 'pix') return 'qr-code';
    if (type === 'cash') return 'payments';
    return 'payment';
  };
  const paymentLabel = (type: string) => {
    const map: Record<string, string> = { credit_card: 'Cartão de Crédito', debit_card: 'Cartão de Débito', pix: 'PIX', cash: 'Dinheiro' };
    return map[type] || type;
  };
  return (
    <SheetModal visible={visible} title="Formas de Pagamento" onClose={onClose}>
      {payments.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <MaterialIcons name="payment" size={52} color={Colors.border} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Nenhum pagamento cadastrado</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(p) => p.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}
          renderItem={({ item }) => (
            <View style={payStyles.card}>
              <View style={payStyles.iconWrap}>
                <MaterialIcons name={paymentIcon(item.type) as any} size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={payStyles.type}>{paymentLabel(item.type)}</Text>
                {item.last_digits ? <Text style={payStyles.digits}>•••• {item.last_digits}</Text> : null}
              </View>
            </View>
          )}
        />
      )}
    </SheetModal>
  );
}

const payStyles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  type: { fontSize: 14, fontWeight: '600', color: Colors.text },
  digits: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});

// Order History Modal
function OrderHistoryModal({ visible, orders, onClose }: { visible: boolean; orders: OrderHistory[]; onClose: () => void }) {
  return (
    <SheetModal visible={visible} title="Histórico de Pedidos" onClose={onClose}>
      {orders.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <MaterialIcons name="history" size={52} color={Colors.border} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Nenhum pedido encontrado</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 12, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const s = getStatus(item.status);
            return (
              <View style={ordStyles.card}>
                <View style={ordStyles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={ordStyles.restName}>{item.restaurant_name}</Text>
                    <Text style={ordStyles.date}>{formatDate(item.created_at)}</Text>
                  </View>
                  <View style={[ordStyles.statusBadge, { backgroundColor: s.color + '20' }]}>
                    <MaterialIcons name={s.icon as any} size={13} color={s.color} />
                    <Text style={[ordStyles.statusText, { color: s.color }]}>{s.label}</Text>
                  </View>
                </View>
                <View style={ordStyles.itemsWrap}>
                  {item.order_items.slice(0, 3).map((oi, i) => (
                    <Text key={i} style={ordStyles.itemLine}>
                      {oi.quantity}x {oi.product_name}
                    </Text>
                  ))}
                  {item.order_items.length > 3 ? <Text style={ordStyles.moreText}>+{item.order_items.length - 3} itens</Text> : null}
                </View>
                <View style={ordStyles.totalRow}>
                  <Text style={ordStyles.totalLabel}>Total</Text>
                  <Text style={ordStyles.totalValue}>R$ {item.total_price.toFixed(2)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SheetModal>
  );
}

const ordStyles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  restName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  date: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  itemsWrap: { gap: 2, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  itemLine: { fontSize: 13, color: Colors.textSecondary },
  moreText: { fontSize: 12, color: Colors.textLight, fontStyle: 'italic' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.primary },
});

// Favorites Modal
function FavoritesModal({ visible, favorites, onClose }: { visible: boolean; favorites: FavoriteRestaurant[]; onClose: () => void }) {
  const router = useRouter();
  return (
    <SheetModal visible={visible} title="Restaurantes Favoritos" onClose={onClose}>
      {favorites.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
          <MaterialIcons name="favorite-border" size={52} color={Colors.border} />
          <Text style={{ fontSize: 15, color: Colors.textSecondary }}>Nenhum favorito ainda</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(f) => f.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={favStyles.card}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                router.push({ pathname: '/restaurant/[id]', params: { id: item.restaurant_id } });
              }}
            >
              <Image
                source={{ uri: item.restaurant.banner_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80' }}
                style={favStyles.img}
                contentFit="cover"
                transition={200}
              />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={favStyles.name}>{item.restaurant.name}</Text>
                <Text style={favStyles.desc} numberOfLines={1}>{item.restaurant.description || 'Restaurante'}</Text>
                <View style={[favStyles.openBadge, { backgroundColor: item.restaurant.is_open ? Colors.success + '20' : Colors.error + '20' }]}>
                  <Text style={[favStyles.openText, { color: item.restaurant.is_open ? Colors.success : Colors.error }]}>
                    {item.restaurant.is_open ? 'Aberto' : 'Fechado'}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        />
      )}
    </SheetModal>
  );
}

const favStyles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, alignItems: 'center' },
  img: { width: 60, height: 60, borderRadius: Radius.sm },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  desc: { fontSize: 12, color: Colors.textSecondary },
  openBadge: { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2 },
  openText: { fontSize: 11, fontWeight: '700' },
});

// ─── Main Profile Screen ───────────────────────────────────────────
type ModalType = 'notifications' | 'addresses' | 'payments' | 'orders' | 'favorites' | null;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadAll = useCallback(async () => {
    if (!user?.id) return;
    const uid = user.id;
    setLoading(true);
    const [prof, orders, favs, revs, notifs] = await Promise.all([
      fetchUserProfile(uid),
      fetchOrdersCount(uid),
      fetchFavoritesCount(uid),
      fetchReviewsCount(uid),
      fetchNotifications(uid),
    ]);
    setProfile(prof);
    setOrdersCount(orders);
    setFavoritesCount(favs);
    setReviewsCount(revs);
    setNotifications(notifs);
    setLoading(false);
  }, [user?.id]);

  // Lazy-load modal data on first open
  const openModal = async (modal: ModalType) => {
    setActiveModal(modal);
    if (!user?.id) return;
    const uid = user.id;
    if (modal === 'addresses' && addresses.length === 0) {
      fetchAddresses(uid).then(setAddresses);
    } else if (modal === 'payments' && payments.length === 0) {
      fetchPaymentMethods(uid).then(setPayments);
    } else if (modal === 'orders' && orderHistory.length === 0) {
      fetchOrderHistory(uid).then(setOrderHistory);
    } else if (modal === 'favorites' && favorites.length === 0) {
      fetchFavorites(uid).then(setFavorites);
    }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Real-time notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = subscribeToNotifications(user.id, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
    });
    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const handleReadNotif = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleSignOut = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const displayEmail = profile?.email || user?.email || '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleHelp = () => {
    Alert.alert(
      'Ajuda e Suporte',
      'Entre em contato pelo email:\nsuporte@upapp.com.br\n\nHorário: seg-sex 8h–18h',
      [{ text: 'OK' }]
    );
  };

  const handleRate = () => {
    Alert.alert(
      'Avaliar o Up App',
      'Obrigado por usar o Up App! Sua avaliação nos ajuda a melhorar cada vez mais.',
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Avaliar ⭐', onPress: () => {} }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Sobre o Up App',
      'Up App — Delivery Rápido e Fácil\nVersão 1.0.0\n\nConecte-se aos melhores restaurantes da sua cidade com praticidade e segurança.',
      [{ text: 'OK' }]
    );
  };

  const MENU_ITEMS = [
    { icon: 'place', label: 'Meus endereços', badge: addresses.length > 0 ? String(addresses.length) : null, modal: 'addresses' as ModalType, onPress: null as (() => void) | null },
    { icon: 'payment', label: 'Formas de pagamento', badge: null, modal: 'payments' as ModalType, onPress: null as (() => void) | null },
    { icon: 'history', label: 'Histórico de pedidos', badge: ordersCount > 0 ? String(ordersCount) : null, modal: 'orders' as ModalType, onPress: null as (() => void) | null },
    { icon: 'favorite', label: 'Restaurantes favoritos', badge: favoritesCount > 0 ? String(favoritesCount) : null, modal: 'favorites' as ModalType, onPress: null as (() => void) | null },
    { icon: 'notifications', label: 'Notificações', badge: unreadCount > 0 ? String(unreadCount) : null, modal: 'notifications' as ModalType, onPress: null as (() => void) | null },
    { icon: 'help-outline', label: 'Ajuda e suporte', badge: null, modal: null, onPress: handleHelp },
    { icon: 'star-outline', label: 'Avaliar o app', badge: null, modal: null, onPress: handleRate },
    { icon: 'info-outline', label: 'Sobre o Up App', badge: null, modal: null, onPress: handleAbout },
  ];

  return (
    <View style={[styles.container]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Gradient Header */}
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={[styles.gradientHeader, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Meu Perfil</Text>
            <TouchableOpacity onPress={loadAll} hitSlop={12} style={styles.refreshBtn}>
              <MaterialIcons name="refresh" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={styles.avatarSection}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" transition={200} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.avatarEditBadge}
              onPress={() => Alert.alert('Alterar foto', 'Esta função estará disponível em breve na versão do aplicativo móvel.', [{ text: 'OK' }])}
              activeOpacity={0.8}
            >
              <MaterialIcons name="camera-alt" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
          {profile?.phone ? <Text style={styles.phone}>{profile.phone}</Text> : null}
        </LinearGradient>

        {/* Stats */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Colors.primary} size="small" />
          </View>
        ) : (
          <View style={styles.statsRow}>
            {[
              { label: 'Pedidos', value: ordersCount, icon: 'receipt-long', onPress: () => openModal('orders') },
              { label: 'Favoritos', value: favoritesCount, icon: 'favorite', onPress: () => openModal('favorites') },
              { label: 'Avaliações', value: reviewsCount, icon: 'star', onPress: () => {} },
            ].map((s, i) => (
              <TouchableOpacity key={s.label} style={[styles.statItem, i < 2 && styles.statBorder]} onPress={s.onPress} activeOpacity={0.7}>
                <MaterialIcons name={s.icon as any} size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.menuItem, idx < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.modal) openModal(item.modal);
                else if (item.onPress) item.onPress();
              }}
            >
              <View style={styles.menuIconWrap}>
                <MaterialIcons name={item.icon as any} size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <View style={styles.menuRight}>
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <MaterialIcons name="chevron-right" size={20} color={Colors.textLight} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sair da conta</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Up App v1.0.0</Text>
      </ScrollView>

      {/* Modals */}
      <NotificationsModal
        visible={activeModal === 'notifications'}
        notifications={notifications}
        onClose={() => setActiveModal(null)}
        onRead={handleReadNotif}
      />
      <AddressesModal
        visible={activeModal === 'addresses'}
        addresses={addresses}
        onClose={() => setActiveModal(null)}
      />
      <PaymentsModal
        visible={activeModal === 'payments'}
        payments={payments}
        onClose={() => setActiveModal(null)}
      />
      <OrderHistoryModal
        visible={activeModal === 'orders'}
        orders={orderHistory}
        onClose={() => setActiveModal(null)}
      />
      <FavoritesModal
        visible={activeModal === 'favorites'}
        favorites={favorites}
        onClose={() => setActiveModal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  gradientHeader: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  refreshBtn: { padding: 4 },
  avatarSection: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarImg: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  loadingWrap: { height: 90, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -20, borderRadius: Radius.lg, ...Shadow.sm },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: Radius.lg,
    marginBottom: 16,
    ...Shadow.md,
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  menuCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: Radius.lg, marginBottom: 16, ...Shadow.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, gap: 12 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
    ...Shadow.sm,
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: Colors.error },
  version: { textAlign: 'center', fontSize: 12, color: Colors.textLight, marginTop: 4 },
});
