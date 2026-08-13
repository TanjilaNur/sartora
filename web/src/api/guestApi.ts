import axios from 'axios';
import { API, authHeader } from './client';
import type { Cart } from '../types/cart';

export async function createGuestSession(): Promise<string> {
  const { data } = await axios.post<{ guestId: string }>(`${API}/guest/session`, {});
  return data.guestId;
}

export async function fetchGuestCart(guestId: string): Promise<Cart> {
  const { data } = await axios.get<{ cart: Cart }>(`${API}/guest/cart/${guestId}`);
  return data.cart;
}

export async function addToGuestCart(
  guestId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<Cart> {
  const { data } = await axios.post<{ cart: Cart }>(`${API}/guest/cart/${guestId}/items`, {
    productId,
    quantity,
    variantId,
  });
  return data.cart;
}

export async function updateGuestCartItem(
  guestId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Promise<Cart> {
  const { data } = await axios.put<{ cart: Cart }>(
    `${API}/guest/cart/${guestId}/items/${productId}`,
    { quantity, variantId }
  );
  return data.cart;
}

export async function removeFromGuestCart(guestId: string, productId: string, variantId?: string): Promise<Cart> {
  const { data } = await axios.delete<{ cart: Cart }>(`${API}/guest/cart/${guestId}/items/${productId}`, {
    params: variantId ? { variantId } : undefined,
  });
  return data.cart;
}

export async function mergeGuestCart(guestId: string): Promise<void> {
  await axios.post(`${API}/guest/cart/${guestId}/merge`, {}, { headers: authHeader() });
}
