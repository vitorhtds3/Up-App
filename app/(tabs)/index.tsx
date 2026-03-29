import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, FontSize, Shadow } from '../../constants/theme';
import { fetchRestaurants, fetchStories } from '../../services/restaurantService';
import { useCart } from '../../hooks/useCart';

const { width: RAW_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = Platform.OS === 'web' && RAW_WIDTH >= 480;
const SCREEN_WIDTH = IS_DESKTOP ? 375 : RAW_WIDTH;

const CATEGORIES_GRID = [
  { id: '1', name: 'Restaurantes', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80', color: '#FFF3E0' },
  { id: '2', name: 'Farmácias', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80', color: '#E8F5E9' },
  { id: '3', name: 'Pets', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=200&q=80', color: '#E3F2FD' },
  { id: '4', name: 'Bebidas', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=200&q=80', color: '#F3E5F5' },
  { id: '5', name: 'Mercados', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80', color: '#E8F5E9' },
  { id: '6', name: 'Hortifruti', image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=200&q=80', color: '#F1F8E9' },
  { id: '7', name: 'Padarias', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80', color: '#FFF8E1' },
  { id: '8', name: 'Ver todos', image: '', color: '#F5F5F5' },
];

const FOOD_CATEGORIES = [
  { id: '1', name: 'Almoço', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', color: '#E53E3E' },
  { id: '2', name: 'Açaí', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300&q=80', color: '#7B2D8B' },
  { id: '3', name: 'Churrascaria', image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=300&q=80', color: '#C05621' },
  { id: '4', name: 'Gelados', image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&q=80', color: '#2B6CB0' },
  { id: '5', name: 'Sushi', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=80', color: '#276749' },
];

// ─── Banner Carousel using real stories ──────────────────────────
function BannerCarousel({ stories }: { stories: any[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const [current, setCurrent] = useState(0);
  const router = useRouter();

  const items = stories.length > 0 ? stories : [
    { id: 'b1', title: 'Peça agora com pagamento online', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', restaurant_id: null },
    { id: 'b2', title: 'Frete grátis no primeiro pedido', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', restaurant_id: null },
    { id: 'b3', title: 'Restaurantes abertos agora', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80', restaurant_id: null },
  ];

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      const next = (current + 1) % items.length;
      setCurrent(next);
      scrollRef.current?.scrollTo({ x: next * (SCREEN_WIDTH - 32), animated: true });
    }, 3500);
    return () => clearInterval(interval);
  }, [current, items.length]);

  return (
    <View style={bannerStyles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH - 32}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
          setCurrent(idx);
        }}
        contentContainerStyle={{ gap: 12 }}
      >
        {items.map((b) => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.92}
            style={bannerStyles.item}
            onPress={() => b.restaurant_id ? router.push({ pathname: '/restaurant/[id]', params: { id: b.restaurant_id } }) : undefined}
          >
            <Image source={{ uri: b.image }} style={bannerStyles.image} contentFit="cover" transition={200} />
            <View style={bannerStyles.overlay}>
              <Text style={bannerStyles.title}>{b.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={bannerStyles.dots}>
        {items.map((_, i) => (
          <View key={i} style={[bannerStyles.dot, i === current && bannerStyles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const bannerStyles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 12 },
  item: { width: SCREEN_WIDTH - 32, height: 110, borderRadius: Radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.42)', padding: 10,
    borderBottomLeftRadius: Radius.lg, borderBottomRightRadius: Radius.lg,
  },
  title: { color: '#fff', fontWeight: '700', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.primary, width: 14 },
});

// ─── Category Grid ────────────────────────────────────────────────
function CategoryGrid() {
  const router = useRouter();
  return (
    <View style={catStyles.grid}>
      {CATEGORIES_GRID.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[catStyles.item, { backgroundColor: cat.color }]}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: cat.name } })}
        >
          {cat.image ? (
            <Image source={{ uri: cat.image }} style={catStyles.img} contentFit="cover" transition={200} />
          ) : (
            <View style={catStyles.seeAllBox}>
              <MaterialIcons name="search" size={22} color={Colors.primary} />
            </View>
          )}
          <Text style={catStyles.name}>{cat.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const catStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  item: { width: (SCREEN_WIDTH - 32 - 18) / 4, borderRadius: Radius.md, overflow: 'hidden', alignItems: 'center' },
  img: { width: '100%', height: 56, borderRadius: Radius.md },
  seeAllBox: { width: '100%', height: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0E8FF' },
  name: { fontSize: 9, fontWeight: '600', color: Colors.text, textAlign: 'center', paddingVertical: 4, paddingHorizontal: 2 },
});

// ─── Food Categories ──────────────────────────────────────────────
function FoodCategoryScroll() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={sectionTitle}>Categorias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FOOD_CATEGORIES.map((fc) => (
          <TouchableOpacity
            key={fc.id}
            style={fcStyles.item}
            activeOpacity={0.85}
            onPress={() => setSelected(selected === fc.id ? null : fc.id)}
          >
            <Image source={{ uri: fc.image }} style={fcStyles.img} contentFit="cover" transition={200} />
            <View style={[fcStyles.overlay, { backgroundColor: fc.color + 'CC' }]}>
              <Text style={fcStyles.name}>{fc.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const fcStyles = StyleSheet.create({
  item: { width: 100, height: 60, borderRadius: Radius.md, overflow: 'hidden' },
  img: { width: '100%', height: '100%' },
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingVertical: 6, paddingHorizontal: 8,
    borderBottomLeftRadius: Radius.md, borderBottomRightRadius: Radius.md,
  },
  name: { color: '#fff', fontWeight: '700', fontSize: 11 },
});

// ─── Top Stores (real restaurants as stories) ─────────────────────
function TopStores({ restaurants }: { restaurants: any[] }) {
  const router = useRouter();
  if (restaurants.length === 0) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={sectionTitle}>Top Lojas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {restaurants.slice(0, 8).map((r) => (
          <TouchableOpacity
            key={r.id}
            style={storyStyles.item}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: r.id } })}
          >
            <View style={storyStyles.ring}>
              <Image source={{ uri: r.logo }} style={storyStyles.img} contentFit="cover" transition={200} />
            </View>
            <Text style={storyStyles.name} numberOfLines={2}>{r.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const storyStyles = StyleSheet.create({
  item: { width: 58, alignItems: 'center', gap: 4 },
  ring: { width: 54, height: 54, borderRadius: 27, borderWidth: 2, borderColor: Colors.primary, padding: 2, overflow: 'hidden' },
  img: { width: '100%', height: '100%', borderRadius: 27 },
  name: { fontSize: 10, color: Colors.text, textAlign: 'center', fontWeight: '500', lineHeight: 13 },
});

// ─── Restaurant Card ──────────────────────────────────────────────
function RestaurantCard({ restaurant }: { restaurant: any }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={rcStyles.card}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: restaurant.id } })}
    >
      <View style={rcStyles.imgWrap}>
        <Image source={{ uri: restaurant.image }} style={rcStyles.image} contentFit="cover" transition={200} />
        {!restaurant.is_open ? (
          <View style={rcStyles.closedOverlay}>
            <Text style={rcStyles.closedText}>Fechado</Text>
          </View>
        ) : null}
        {restaurant.delivery_fee === 0 ? (
          <View style={rcStyles.freeBadge}>
            <Text style={rcStyles.freeBadgeText}>Frete grátis</Text>
          </View>
        ) : null}
      </View>
      <View style={rcStyles.info}>
        <View style={{ flex: 1 }}>
          <Text style={rcStyles.name} numberOfLines={1}>{restaurant.name}</Text>
          <Text style={rcStyles.category}>{restaurant.category}</Text>
        </View>
        <View style={rcStyles.meta}>
          <View style={rcStyles.ratingRow}>
            <MaterialIcons name="star" size={13} color={Colors.star} />
            <Text style={rcStyles.rating}>{restaurant.rating}</Text>
          </View>
          <Text style={rcStyles.dot}>•</Text>
          <MaterialIcons name="access-time" size={13} color={Colors.textLight} />
          <Text style={rcStyles.time}>{restaurant.delivery_time} min</Text>
          <Text style={rcStyles.dot}>•</Text>
          <Text style={rcStyles.fee}>
            {restaurant.delivery_fee === 0 ? 'Grátis' : `R$ ${restaurant.delivery_fee.toFixed(2)}`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const rcStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, marginHorizontal: 16, marginBottom: 10, overflow: 'hidden', ...Shadow.sm },
  imgWrap: { position: 'relative', height: 112 },
  image: { width: '100%', height: '100%' },
  closedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  closedText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  freeBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.success, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { paddingHorizontal: 12, paddingVertical: 10 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  category: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  dot: { color: Colors.textLight, fontSize: 9 },
  time: { fontSize: 12, color: Colors.textSecondary },
  fee: { fontSize: 12, color: Colors.textSecondary },
});

const sectionTitle = {
  fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 10, paddingHorizontal: 16,
};

// ─── Home Screen ──────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { totalItems } = useCart();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [rests, strs] = await Promise.all([
        fetchRestaurants(),
        fetchStories(),
      ]);
      setRestaurants(rests);
      setStories(strs);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Header */}
        <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[headerStyles.gradient, { paddingTop: insets.top + 8 }]}>
          <View style={headerStyles.container}>
            <View style={headerStyles.location}>
              <MaterialIcons name="place" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={headerStyles.locationText}>Centro, Confresa</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="rgba(255,255,255,0.7)" />
            </View>
            <TouchableOpacity style={headerStyles.cartBtn} onPress={() => router.push('/cart')} activeOpacity={0.85}>
              <MaterialIcons name="shopping-bag" size={20} color="#fff" />
              {totalItems > 0 ? (
                <View style={headerStyles.badge}>
                  <Text style={headerStyles.badgeText}>{totalItems}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={searchStyles.bar} activeOpacity={0.8} onPress={() => router.push('/(tabs)/search')}>
            <MaterialIcons name="search" size={18} color={Colors.textLight} />
            <Text style={searchStyles.placeholder}>Buscar restaurantes ou pratos...</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Category Grid */}
        <View style={{ marginTop: 14 }}>
          <CategoryGrid />
        </View>

        {/* Banner Carousel */}
        <BannerCarousel stories={stories} />

        {/* Food Categories */}
        <FoodCategoryScroll />

        {/* Top Stores */}
        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
        ) : (
          <TopStores restaurants={restaurants} />
        )}

        {/* Latest Restaurants */}
        <View style={{ marginBottom: 4 }}>
          <Text style={sectionTitle}>Últimas Lojas</Text>
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 16 }} />
          ) : restaurants.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 24, gap: 8 }}>
              <MaterialIcons name="storefront" size={40} color={Colors.border} />
              <Text style={{ fontSize: 14, color: Colors.textSecondary }}>Nenhum restaurante disponível</Text>
            </View>
          ) : (
            restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  gradient: { paddingBottom: 12 },
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  locationText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  cartBtn: { position: 'relative', padding: 4 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#fff', borderRadius: 9, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: Colors.primary, fontSize: 9, fontWeight: '800' },
});

const searchStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: Radius.md, paddingHorizontal: 12, height: 40, ...Shadow.md },
  placeholder: { fontSize: 13, color: Colors.textLight, flex: 1 },
});
