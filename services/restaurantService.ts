import { supabase } from '../lib/supabase';

const APPROVED_STATUSES = ['approved', 'active', 'ativo', 'aprovado'];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80';
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&q=80';

export function normalizeRestaurant(r: any) {
  return {
    id: r.id,
    name: r.name || 'Restaurante',
    image: r.banner_url || FALLBACK_IMAGE,
    logo: r.banner_url || FALLBACK_IMAGE,
    category: r.category || r.cuisine_type || 'Restaurante',
    rating: Number(r.rating) || 4.5,
    delivery_time: r.delivery_time || '25-40',
    delivery_fee: Number(r.delivery_fee) || 4.99,
    min_order: Number(r.min_order) || 20,
    description: r.description || '',
    address: r.address || '',
    is_open: r.is_open ?? true,
    status: r.status || 'active',
    promoted: false,
  };
}

export function normalizeProduct(p: any) {
  return {
    id: p.id,
    restaurant_id: p.restaurant_id,
    name: p.name || 'Produto',
    description: p.description || '',
    price: Number(p.price) || 0,
    image: p.image_url || FALLBACK_PRODUCT_IMAGE,
    category: p.category || 'Cardápio',
    available: p.active ?? true,
  };
}

export async function fetchRestaurants(): Promise<ReturnType<typeof normalizeRestaurant>[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .in('status', APPROVED_STATUSES)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[restaurantService] fetchRestaurants error:', error.message);
    return [];
  }
  if (!data || data.length === 0) return [];
  return data.map(normalizeRestaurant);
}

export async function fetchRestaurantById(id: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('[restaurantService] fetchRestaurantById error:', error.message);
    return null;
  }
  if (!data) return null;
  return normalizeRestaurant(data);
}

export async function fetchProducts(restaurantId: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[restaurantService] fetchProducts error:', error.message);
    return [];
  }
  if (!data) return [];
  return data.map(normalizeProduct);
}

export async function searchRestaurants(query: string) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .in('status', APPROVED_STATUSES)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[restaurantService] searchRestaurants error:', error.message);
    return [];
  }
  if (!data) return [];
  return data.map(normalizeRestaurant);
}

export async function fetchAllRestaurants() {
  return fetchRestaurants();
}

export async function fetchStories() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('stories')
    .select('*, restaurants(name, banner_url)')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('[restaurantService] fetchStories error:', error.message);
    return [];
  }
  if (!data) return [];

  return data.map((s: any) => ({
    id: s.id,
    title: s.title || s.restaurants?.name || 'Promoção',
    image: s.image_url || s.restaurants?.banner_url || FALLBACK_IMAGE,
    restaurant_id: s.restaurant_id,
    restaurant_name: s.restaurants?.name || '',
  }));
}
