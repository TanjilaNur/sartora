import axios from 'axios';

export interface GuestSession {
  guestId: string;
  itemCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface GuestSessionsResponse {
  sessions: GuestSession[];
  total: number;
  page: number;
  totalPages: number;
}

const BASE = 'http://localhost:4000/api/guest';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchGuestSessions(
  token: string,
  page = 1,
  limit = 20
): Promise<GuestSessionsResponse> {
  const { data } = await axios.get<GuestSessionsResponse>(`${BASE}/admin/sessions`, {
    headers: authHeader(token),
    params: { page, limit },
  });
  return data;
}

export async function removeGuestSession(token: string, guestId: string): Promise<void> {
  await axios.delete(`${BASE}/admin/sessions/${guestId}`, {
    headers: authHeader(token),
  });
}
