import axios from 'axios';
import type { CustomersResponse, CustomerProfile } from '../types/customer';

const BASE = 'http://localhost:4000/api/users';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchCustomers(
  token: string,
  params?: { search?: string; page?: number; limit?: number }
): Promise<CustomersResponse> {
  const { data } = await axios.get<CustomersResponse>(BASE, { headers: authHeader(token), params });
  return data;
}

export async function fetchCustomerProfile(token: string, userId: string): Promise<CustomerProfile> {
  const { data } = await axios.get<CustomerProfile>(`${BASE}/${userId}`, { headers: authHeader(token) });
  return data;
}
