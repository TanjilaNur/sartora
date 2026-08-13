import axios from 'axios';
import { API, authHeader } from './client';
import type { Cart } from '../types/cart';

export async function fetchCart(): Promise<Cart> {
  const { data } = await axios.get<{ cart: Cart }>(`${API}/cart`, { headers: authHeader() });
  return data.cart;
}

export async function addToCart(productId: string, quantity: number, variantId?: string): Promise<Cart> {
  const { data } = await axios.post<{ cart: Cart }>(
    `${API}/cart/${productId}`,
    { quantity, variantId },
    { headers: authHeader() }
  );
  return data.cart;
}

export async function updateCartItem(productId: string, quantity: number, variantId?: string): Promise<Cart> {
  const { data } = await axios.put<{ cart: Cart }>(
    `${API}/cart/${productId}`,
    { quantity, variantId },
    { headers: authHeader() }
  );
  return data.cart;
}

export async function removeFromCart(productId: string, variantId?: string): Promise<Cart> {
  const { data } = await axios.delete<{ cart: Cart }>(`${API}/cart/${productId}`, {
    headers: authHeader(),
    params: variantId ? { variantId } : undefined,
  });
  return data.cart;
}
