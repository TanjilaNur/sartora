import axios from 'axios';
import type { DashboardData } from '../types/analytics';

const BASE = 'http://localhost:4000/api/analytics';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export interface DashboardDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export async function fetchDashboard(
  token: string,
  days: number,
  range?: DashboardDateRange
): Promise<DashboardData> {
  const { data } = await axios.get<DashboardData>(`${BASE}/dashboard`, {
    headers: authHeader(token),
    params: { days, ...range },
  });
  return data;
}
