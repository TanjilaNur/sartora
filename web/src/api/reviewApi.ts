import axios from 'axios';
import { API, authHeader } from './client';
import type { ProductReviewsResponse, Review } from '../types/review';

export async function fetchProductReviews(productId: string, page = 1, limit = 20): Promise<ProductReviewsResponse> {
  const { data } = await axios.get<ProductReviewsResponse>(`${API}/reviews/product/${productId}`, {
    params: { page, limit },
  });
  return data;
}

export async function fetchMyReviews(): Promise<Review[]> {
  const { data } = await axios.get<{ reviews: Review[] }>(`${API}/reviews/my`, { headers: authHeader() });
  return data.reviews;
}

export async function addReview(productId: string, rating: number, text: string): Promise<Review> {
  const { data } = await axios.post<{ review: Review }>(
    `${API}/reviews/product/${productId}`,
    { rating, text },
    { headers: authHeader() }
  );
  return data.review;
}

export async function editReview(reviewId: string, rating: number, text: string): Promise<Review> {
  const { data } = await axios.put<{ review: Review }>(
    `${API}/reviews/${reviewId}`,
    { rating, text },
    { headers: authHeader() }
  );
  return data.review;
}

export async function deleteReview(reviewId: string): Promise<void> {
  await axios.delete(`${API}/reviews/${reviewId}`, { headers: authHeader() });
}

export async function reportReview(reviewId: string): Promise<void> {
  await axios.post(`${API}/reviews/${reviewId}/report`, {}, { headers: authHeader() });
}
