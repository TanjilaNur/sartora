import axios from 'axios';
import type { Review } from '../types/review';

const BASE = 'http://localhost:4000/api/reviews';

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchReportedReviews(token: string): Promise<Review[]> {
  const { data } = await axios.get<{ reviews: Review[] }>(`${BASE}/admin/reported`, {
    headers: authHeader(token),
  });
  return data.reviews;
}

export async function deleteReview(token: string, reviewId: string): Promise<void> {
  await axios.delete(`${BASE}/${reviewId}`, { headers: authHeader(token) });
}
