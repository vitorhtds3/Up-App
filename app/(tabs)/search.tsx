import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { fetchRestaurants, searchRestaurants } from '../../services/restaurantService';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [query, setQuery] = useState((params.category as string) || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const doSearch = useCallback(async (q: string) => {
    setLoading(true);
    if (q.trim().length === 0) {
      const data = await fetchRestaurants();
      setResults(data);
    } else {
      const data = await searchRestaurants(q.trim());
      setResults(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timeout);
  }, [query, doSearch]);

  return (
    <View style={[styles.container]}>
      {/* Gradient Header */}
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>Buscar</Text>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder="Restaurantes, pratos, culinária..."
            placeholderTextColor={Colors.textLight}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={12}>
              <MaterialIcons name="close" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultsCount}>
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
                {query ? ` para "${query}"` : ''}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="search-off" size={64} color={Colors.border} />
              <Text style={styles.emptyTitle}>Nenhum resultado</Text>
              <Text style={styles.emptyText}>
                {query ? `Nenhum restaurante encontrado para "${query}"` : 'Nenhum restaurante disponível'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.id } })}
            >
              <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={200} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.category} numberOfLines={1}>{item.category}</Text>
                <View style={styles.meta}>
                  <MaterialIcons name="star" size={13} color={Colors.star} />
                  <Text style={styles.rating}>{item.rating}</Text>
                  <Text style={styles.sep}>•</Text>
                  <MaterialIcons name="access-time" size={12} color={Colors.textLight} />
                  <Text style={styles.time}>{item.delivery_time} min</Text>
                  <Text style={styles.sep}>•</Text>
                  <Text style={styles.fee}>
                    {item.delivery_fee === 0 ? 'Frete grátis' : `R$ ${item.delivery_fee.toFixed(2)}`}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.is_open ? Colors.success + '20' : Colors.error + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: item.is_open ? Colors.success : Colors.error }]} />
                  <Text style={[styles.statusText, { color: item.is_open ? Colors.success : Colors.error }]}>
                    {item.is_open ? 'Aberto' : 'Fechado'}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: Radius.md,
    paddingHorizontal: 14, height: 48, ...Shadow.sm,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  resultsCount: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderRadius: Radius.md, overflow: 'hidden',
    alignItems: 'center', ...Shadow.sm,
  },
  image: { width: 100, height: 100 },
  info: { flex: 1, padding: 12, gap: 4 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.text },
  category: { fontSize: 12, color: Colors.textSecondary },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rating: { fontSize: 12, fontWeight: '600', color: Colors.text },
  sep: { color: Colors.textLight, fontSize: 10 },
  time: { fontSize: 12, color: Colors.textSecondary },
  fee: { fontSize: 12, color: Colors.textSecondary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
