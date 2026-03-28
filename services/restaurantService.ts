import { supabase } from '../lib/supabase';

// Normalize restaurant row from Supabase schema to app shape
export function normalizeRestaurant(r: any) {
  return {
    id: r.id,
    name: r.name,
    image: r.banner_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
    logo: r.banner_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
    category: r.description || 'Restaurante',
    rating: 4.5,
    delivery_time: '25-40',
    delivery_fee: 4.99,
    min_order: 20,
    description: r.description || '',
    address: r.address || '',
    is_open: r.is_open ?? true,
    promoted: false,
  };
}

// Normalize product row from Supabase schema to app shape
export function normalizeProduct(p: any) {
  return {
    id: p.id,
    restaurant_id: p.restaurant_id,
    name: p.name,
    description: p.description || '',
    price: Number(p.price) || 0,
    image: p.image_url || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80',
    category: 'Cardápio',
    available: p.is_available ?? true,
  };
}

export async function fetchRestaurants(): Promise<ReturnType<typeof normalizeRestaurant>[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) return [];
  return data.map(normalizeRestaurant);
}

export async function fetchRestaurantById(id: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return normalizeRestaurant(data);
}

export async function fetchProducts(restaurantId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(normalizeProduct);
}

export async function searchRestaurants(query: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map(normalizeRestaurant);
}

export async function fetchAllRestaurants() {
  return fetchRestaurants();
}

export async function fetchStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*, restaurants(name, banner_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(10);
  if (error || !data) return [];
  return data.map((s: any) => ({
    id: s.id,
    title: s.title || s.restaurants?.name || 'Promoção',
    image: s.image_url || s.restaurants?.banner_url || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
    restaurant_id: s.restaurant_id,
    restaurant_name: s.restaurants?.name || '',
  }));
}
