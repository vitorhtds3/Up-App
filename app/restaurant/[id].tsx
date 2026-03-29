import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, Shadow, Spacing } from '../../constants/theme';
import { fetchRestaurantById, fetchProducts } from '../../services/restaurantService';
import { useCart } from '../../hooks/useCart';

const { width: W } = Dimensions.get('window');
const HEADER_HEIGHT = 260;

function AddToCartSheet({
  product,
  visible,
  onClose,
  onAdd,
}: {
  product: any;
  visible: boolean;
  onClose: () => void;
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (visible) setQty(1);
  }, [visible]);

  if (!visible || !product) return null;

  return (
    <View style={modalStyles.overlay}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <View style={modalStyles.handle} />
        <Image source={{ uri: product.image }} style={modalStyles.image} contentFit="cover" transition={200} />
        <View style={modalStyles.info}>
          <Text style={modalStyles.name}>{product.name}</Text>
          {!!product.description && (
            <Text style={modalStyles.description}>{product.description}</Text>
          )}
          <Text style={modalStyles.price}>R$ {product.price.toFixed(2)}</Text>
        </View>
        <View style={modalStyles.qtyRow}>
          <TouchableOpacity
            style={[modalStyles.qtyBtn, qty <= 1 && { opacity: 0.4 }]}
            onPress={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
          >
            <MaterialIcons name="remove" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={modalStyles.qtyText}>{qty}</Text>
          <TouchableOpacity style={modalStyles.qtyBtn} onPress={() => setQty((q) => q + 1)}>
            <MaterialIcons name="add" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={modalStyles.addBtn}
          onPress={() => { onAdd(qty); onClose(); }}
          activeOpacity={0.88}
        >
          <Text style={modalStyles.addBtnText}>
            Adicionar {qty}x — R$ {(product.price * qty).toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  handle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 16 },
  image: { width: '100%', height: 180 },
  info: { padding: 20, gap: 6 },
  name: { fontSize: 20, fontFamily: 'Nunito_700Bold', color: Colors.text },
  description: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: Colors.textSecondary, lineHeight: 20 },
  price: { fontSize: 22, fontFamily: 'Nunito_800ExtraBold', color: Colors.primary, marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 16 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 22, fontFamily: 'Nunito_700Bold', color: Colors.text, minWidth: 32, textAlign: 'center' },
  addBtn: { backgroundColor: Colors.primary, marginHorizontal: 20, borderRadius: Radius.md, height: 54, alignItems: 'center', justifyContent: 'center', ...Shadow.md },
  addBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});

function ProductCard({ product, onPress }: { product: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={prodStyles.card} activeOpacity={0.88} onPress={onPress}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={prodStyles.name}>{product.name}</Text>
        <Text style={prodStyles.description} numberOfLines={2}>{product.description}</Text>
        <Text style={prodStyles.price}>R$ {product.price.toFixed(2)}</Text>
      </View>
      <View style={prodStyles.imageWrap}>
        <Image source={{ uri: product.image }} style={prodStyles.image} contentFit="cover" transition={200} />
        <View style={prodStyles.addBtnSmall}>
          <MaterialIcons name="add" size={18} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const prodStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: 14,
    gap: 14,
    alignItems: 'center',
    ...Shadow.sm,
  },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  description: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  price: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 2 },
  imageWrap: { position: 'relative', width: 90, height: 90 },
  image: { width: 90, height: 90, borderRadius: Radius.sm },
  addBtnSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
});

export default function RestaurantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { addItem, totalItems } = useCart();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (id) {
      setPageLoading(true);
      Promise.all([
        fetchRestaurantById(id),
        fetchProducts(id),
      ]).then(([r, p]) => {
        if (r) setRestaurant(r);
        setProducts(p as any[]);
        setPageLoading(false);
      });
    }
  }, [id]);

  const categories = [...new Set(products.map((p) => p.category))];
  const filtered = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const headerBg = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 80, HEADER_HEIGHT - 40],
    outputRange: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)'],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [HEADER_HEIGHT - 60, HEADER_HEIGHT - 20],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  if (pageLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  if (!restaurant) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, gap: 12 }}>
        <MaterialIcons name="storefront" size={56} color={Colors.border} />
        <Text style={{ fontSize: 16, color: Colors.textSecondary }}>Restaurante não encontrado</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Floating Nav */}
      <Animated.View
        style={[styles.navBar, { paddingTop: insets.top, backgroundColor: headerBg, pointerEvents: 'box-none' }]}
      >
        <TouchableOpacity style={styles.navBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} activeOpacity={0.85}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Animated.Text style={[styles.navTitle, { opacity: titleOpacity }]} numberOfLines={1}>
          {restaurant.name}
        </Animated.Text>
        <TouchableOpacity
          style={styles.navBtn}
          activeOpacity={0.85}
          onPress={() => setIsFavorite((v) => !v)}
        >
          <MaterialIcons
            name={isFavorite ? 'favorite' : 'favorite-border'}
            size={22}
            color={isFavorite ? Colors.error : Colors.text}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Hero Image */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: restaurant.image }} style={styles.hero} contentFit="cover" transition={200} />
          <View style={styles.heroOverlay} />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.restaurantCategory}>{restaurant.category} • {restaurant.address}</Text>
            </View>
            <View style={[styles.openBadge, { backgroundColor: restaurant.is_open ? Colors.success + '20' : Colors.error + '20' }]}>
              <View style={[styles.openDot, { backgroundColor: restaurant.is_open ? Colors.success : Colors.error }]} />
              <Text style={[styles.openText, { color: restaurant.is_open ? Colors.success : Colors.error }]}>
                {restaurant.is_open ? 'Aberto' : 'Fechado'}
              </Text>
            </View>
          </View>
          <Text style={styles.description}>{restaurant.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MaterialIcons name="star" size={16} color={Colors.star} />
              <Text style={styles.metaValue}>{restaurant.rating}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color={Colors.primary} />
              <Text style={styles.metaValue}>{restaurant.delivery_time} min</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialIcons name="delivery-dining" size={16} color={Colors.primary} />
              <Text style={styles.metaValue}>
                {restaurant.delivery_fee === 0 ? 'Grátis' : `R$ ${restaurant.delivery_fee.toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <MaterialIcons name="shopping-bag" size={16} color={Colors.primary} />
              <Text style={styles.metaValue}>Mín. R$ {restaurant.min_order?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Category Filter */}
        {categories.length > 1 ? (
          <View style={{ marginTop: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            >
              <TouchableOpacity
                style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>Todos</Text>
              </TouchableOpacity>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                >
                  <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Products */}
        <View style={{ padding: 16, gap: 12, marginTop: 8 }}>
          <Text style={styles.sectionTitle}>Cardápio</Text>
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => setSelectedProduct(product)}
            />
          ))}
        </View>
      </Animated.ScrollView>

      {/* Cart Fab */}
      {totalItems > 0 ? (
        <View style={[styles.cartFab, { bottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.cartFabInner}
            onPress={() => router.push('/cart')}
            activeOpacity={0.88}
          >
            <View style={styles.cartFabBadge}>
              <Text style={styles.cartFabBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartFabText}>Ver carrinho</Text>
            <MaterialIcons name="shopping-bag" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Add to Cart Sheet */}
      <AddToCartSheet
        product={selectedProduct}
        visible={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAdd={(qty) => {
          for (let i = 0; i < qty; i++) {
            addItem({
              id: selectedProduct.id,
              name: selectedProduct.name,
              price: selectedProduct.price,
              image: selectedProduct.image,
              restaurant_id: selectedProduct.restaurant_id,
              restaurant_name: restaurant.name,
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: Colors.text, paddingHorizontal: 8 },
  heroWrap: { height: HEADER_HEIGHT, position: 'relative' },
  hero: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: 'rgba(0,0,0,0.15)' },
  infoCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    gap: 10,
    ...Shadow.sm,
  },
  infoHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  restaurantName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  restaurantCategory: { fontSize: 13, color: Colors.textSecondary },
  openBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '700' },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, marginTop: 4 },
  metaItem: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 4 },
  metaValue: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  metaDivider: { width: 1, height: 20, backgroundColor: Colors.border },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cartFab: { position: 'absolute', left: 16, right: 16 },
  cartFabInner: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Shadow.lg,
  },
  cartFabBadge: {
    backgroundColor: '#fff',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFabBadgeText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  cartFabText: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
});
