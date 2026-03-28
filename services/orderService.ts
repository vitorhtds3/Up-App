import { supabase } from '../lib/supabase';

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface CreateOrderPayload {
  user_id: string;
  restaurant_id: string;
  restaurant_name: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_address: string;
  payment_method: string;
}

export async function createOrder(payload: CreateOrderPayload) {
  // Try the create_order() RPC function first (handles driver assignment, earnings, etc.)
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_order', {
    p_client_id: payload.user_id,
    p_restaurant_id: payload.restaurant_id,
    p_total: payload.total,
    p_delivery_fee: payload.delivery_fee,
    p_items: payload.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.unit_price,
    })),
  });

  if (!rpcError && rpcData) {
    return rpcData;
  }

  // Fallback: direct insert using correct schema columns
  console.log('RPC create_order fallback, reason:', rpcError?.message);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: payload.user_id,
      restaurant_id: payload.restaurant_id,
      total: payload.total,
      delivery_fee: payload.delivery_fee,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Erro ao criar pedido');
  }

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price: item.unit_price,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    console.error('Order items error:', itemsError);
  }

  return order;
}

export async function fetchUserOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        product_id,
        products ( name )
      ),
      restaurants ( name )
    `)
    .eq('client_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((o: any) => ({
    ...o,
    restaurant_name: o.restaurants?.name || 'Restaurante',
    total: Number(o.total_price) || 0,
    order_items: (o.order_items || []).map((i: any) => ({
      product_name: i.products?.name || 'Item',
      quantity: i.quantity,
      unit_price: Number(i.price) || 0,
    })),
  }));
}

export function subscribeToOrder(orderId: string, callback: (order: any) => void) {
  return supabase
    .channel(`order_${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => callback(payload.new)
    )
    .subscribe();
}
