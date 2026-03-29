import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatar_url: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  street: string;
  city: string;
  postal_code: string;
}

export interface PaymentMethod {
  id: string;
  type: string;
  last_digits: string | null;
  created_at: string;
}

export interface OrderHistory {
  id: string;
  status: string;
  total_price: number;
  delivery_address: string;
  created_at: string;
  restaurant_name: string;
  order_items: { product_name: string; quantity: number; price: number }[];
}

export interface FavoriteRestaurant {
  id: string;
  restaurant_id: string;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    banner_url: string | null;
    description: string | null;
    is_open: boolean;
  };
}

// Fetch user data from users + user_profiles tables
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const [userRes, profileRes] = await Promise.all([
      supabase.from('users').select('id, name, email, phone, role').eq('id', userId).single(),
      supabase.from('user_profiles').select('avatar_url, address, city, postal_code').eq('user_id', userId).single(),
    ]);

    if (userRes.error || !userRes.data) return null;

    return {
      ...userRes.data,
      avatar_url: profileRes.data?.avatar_url ?? null,
      address: profileRes.data?.address ?? null,
      city: profileRes.data?.city ?? null,
      postal_code: profileRes.data?.postal_code ?? null,
    };
  } catch {
    return null;
  }
}

// Count orders for current user
export async function fetchOrdersCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', userId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Count favorites for current user
export async function fetchFavoritesCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('favorites')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Count reviews by current user
export async function fetchReviewsCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', userId);
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

// Fetch notifications
export async function fetchNotifications(userId: string): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// Fetch addresses
export async function fetchAddresses(userId: string): Promise<Address[]> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('id, street, city, postal_code')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// Fetch payment methods
export async function fetchPaymentMethods(userId: string): Promise<PaymentMethod[]> {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, type, last_digits, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

// Fetch order history with items
export async function fetchOrderHistory(userId: string): Promise<OrderHistory[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        delivery_fee,
        created_at,
        restaurants ( name ),
        order_items (
          quantity,
          price,
          products ( name )
        )
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];

    return data.map((o: any) => ({
      id: o.id,
      status: o.status,
      total_price: Number(o.total) || 0,
      delivery_address: '',
      created_at: o.created_at,
      restaurant_name: o.restaurants?.name || 'Restaurante',
      order_items: (o.order_items || []).map((i: any) => ({
        product_name: i.products?.name || 'Item',
        quantity: i.quantity,
        price: Number(i.price) || 0,
      })),
    }));
  } catch {
    return [];
  }
}

// Fetch favorite restaurants
export async function fetchFavorites(userId: string): Promise<FavoriteRestaurant[]> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        restaurant_id,
        created_at,
        restaurants ( id, name, banner_url, description, is_open )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((f: any) => ({
      id: f.id,
      restaurant_id: f.restaurant_id,
      created_at: f.created_at,
      restaurant: f.restaurants || { id: f.restaurant_id, name: 'Restaurante', banner_url: null, description: null, is_open: false },
    }));
  } catch {
    return [];
  }
}

// Subscribe to new notifications in real time
export function subscribeToNotifications(userId: string, onNew: (n: Notification) => void) {
  return supabase
    .channel(`notifications_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification)
    )
    .subscribe();
}

// Mark notification as read
export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}
