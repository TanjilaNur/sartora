import axios from 'axios';
import { API, authHeader } from './client';
import type { PointsHistoryResponse, MyBadgesResponse, LeaderboardResponse } from '../types/points';

export async function fetchMyPoints(page = 1, limit = 20): Promise<PointsHistoryResponse> {
  const { data } = await axios.get<PointsHistoryResponse>(`${API}/points/me`, {
    params: { page, limit },
    headers: authHeader(),
  });
  return data;
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderboardResponse> {
  const { data } = await axios.get<LeaderboardResponse>(`${API}/points/leaderboard`, {
    params: { limit },
    headers: authHeader(),
  });
  return data;
}

export async function fetchMyBadges(): Promise<MyBadgesResponse> {
  const { data } = await axios.get<MyBadgesResponse>(`${API}/badges/my`, { headers: authHeader() });
  return data;
}
