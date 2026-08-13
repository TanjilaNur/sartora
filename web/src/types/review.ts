export interface Review {
  _id: string;
  user: { _id: string; name: string; email: string } | string;
  product: { _id: string; name: string; images?: string[] } | string;
  rating: number;
  text: string;
  verified: boolean;
  reported: boolean;
  createdAt: string;
}

export interface ProductReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
}

export function reviewUserName(review: Review): string {
  if (typeof review.user === 'string') return 'Anonymous';
  return review.user.name || review.user.email || 'Anonymous';
}

export function reviewUserId(review: Review): string {
  return typeof review.user === 'string' ? review.user : review.user._id;
}
