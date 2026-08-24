import axios from 'axios';
import { API, authHeader } from './client';
import type { User, Address, AddressInput } from '../types/user';
import type { Product } from '../types/product';

export async function fetchMyProfile(): Promise<User> {
  const { data } = await axios.get<{ user: User }>(`${API}/users/me`, { headers: authHeader() });
  return data.user;
}

export async function updateMyProfile(input: { name?: string; email?: string; phone?: string }): Promise<User> {
  const { data } = await axios.patch<{ user: User }>(`${API}/users/me`, input, { headers: authHeader() });
  return data.user;
}

export async function deleteMyAccount(): Promise<void> {
  await axios.delete(`${API}/users/me`, { headers: authHeader() });
}

export async function fetchMyAddresses(): Promise<Address[]> {
  const { data } = await axios.get<{ addresses: Address[] }>(`${API}/users/me/addresses`, { headers: authHeader() });
  return data.addresses;
}

export async function addMyAddress(input: AddressInput): Promise<Address[]> {
  const { data } = await axios.post<{ addresses: Address[] }>(`${API}/users/me/addresses`, input, { headers: authHeader() });
  return data.addresses;
}

export async function updateMyAddress(addressId: string, input: Partial<AddressInput>): Promise<Address[]> {
  const { data } = await axios.patch<{ addresses: Address[] }>(`${API}/users/me/addresses/${addressId}`, input, {
    headers: authHeader(),
  });
  return data.addresses;
}

export async function deleteMyAddress(addressId: string): Promise<Address[]> {
  const { data } = await axios.delete<{ addresses: Address[] }>(`${API}/users/me/addresses/${addressId}`, {
    headers: authHeader(),
  });
  return data.addresses;
}

export async function fetchMyWishlist(): Promise<Product[]> {
  const { data } = await axios.get<{ wishlist: Product[] }>(`${API}/users/me/wishlist`, { headers: authHeader() });
  return data.wishlist;
}

export async function addToWishlist(productId: string): Promise<void> {
  await axios.post(`${API}/users/me/wishlist/${productId}`, {}, { headers: authHeader() });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await axios.delete(`${API}/users/me/wishlist/${productId}`, { headers: authHeader() });
}

export async function updateNotificationsEnabled(enabled: boolean): Promise<boolean> {
  const { data } = await axios.patch<{ notificationsEnabled: boolean }>(
    `${API}/users/me/notification-preferences`,
    { enabled },
    { headers: authHeader() }
  );
  return data.notificationsEnabled;
}

export async function registerPushToken(token: string): Promise<void> {
  await axios.post(`${API}/users/me/push-token`, { token, platform: 'web' }, { headers: authHeader() });
}

export async function unregisterPushToken(token: string): Promise<void> {
  await axios.delete(`${API}/users/me/push-token`, { headers: authHeader(), data: { token } });
}
