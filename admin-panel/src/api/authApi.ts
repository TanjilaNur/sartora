import axios from 'axios';
import type { LoginResponse } from '../types/auth';

const BASE = 'http://localhost:4000/api/auth';

export async function adminLogin(email: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${BASE}/login`, { email, password });
  return data;
}

export async function adminRefresh(refreshToken: string): Promise<{ token: string }> {
  const { data } = await axios.post<{ token: string }>(`${BASE}/refresh`, { refreshToken });
  return data;
}

export async function adminPhoneLogin(phone: string, password: string): Promise<LoginResponse> {
  const { data } = await axios.post<LoginResponse>(`${BASE}/phone-login`, { phone, password });
  return data;
}

export async function adminLogout(token: string): Promise<void> {
  await axios.post(`${BASE}/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
}
