import axios from 'axios';
import { API, authHeader } from './client';
import type { AuthResponse } from '../types/user';

export async function register(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
}): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/register`, input);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/login`, { email, password });
  return data;
}

export async function phoneLogin(phone: string, password: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/phone-login`, { phone, password });
  return data;
}

export async function logout(): Promise<void> {
  await axios.post(`${API}/auth/logout`, {}, { headers: authHeader() });
}

export async function forgotPassword(email: string): Promise<void> {
  await axios.post(`${API}/auth/forgot-password`, { email });
}

export async function resetPassword(email: string, token: string, password: string): Promise<void> {
  await axios.post(`${API}/auth/reset-password`, { email, token, password });
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const { data } = await axios.post<AuthResponse>(`${API}/auth/google`, { idToken });
  return data;
}
