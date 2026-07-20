import axios from 'axios';
import type { Badge, CreateBadgePayload, UpdateBadgePayload, LeaderboardResponse } from '../types/points';

const BADGES_BASE = 'http://localhost:4000/api/badges';
const POINTS_BASE = 'http://localhost:4000/api/points';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchBadges(): Promise<Badge[]> {
  const { data } = await axios.get<{ badges: Badge[] }>(BADGES_BASE);
  return data.badges;
}

export async function createBadge(token: string, payload: CreateBadgePayload): Promise<Badge> {
  const { data } = await axios.post<{ badge: Badge }>(BADGES_BASE, payload, {
    headers: authHeader(token),
  });
  return data.badge;
}

export async function updateBadge(token: string, id: string, payload: UpdateBadgePayload): Promise<Badge> {
  const { data } = await axios.put<{ badge: Badge }>(`${BADGES_BASE}/${id}`, payload, {
    headers: authHeader(token),
  });
  return data.badge;
}

export async function deleteBadge(token: string, id: string): Promise<void> {
  await axios.delete(`${BADGES_BASE}/${id}`, { headers: authHeader(token) });
}

export async function fetchLeaderboard(token: string, limit = 20): Promise<LeaderboardResponse> {
  const { data } = await axios.get<LeaderboardResponse>(`${POINTS_BASE}/leaderboard`, {
    headers: authHeader(token),
    params: { limit },
  });
  return data;
}
