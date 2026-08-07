export interface Review {
  _id: string;
  user: { _id: string; name: string; email: string } | string | null;
  product: { _id: string; name: string } | string | null;
  rating: number;
  text: string;
  verified: boolean;
  reported: boolean;
  createdAt: string;
  updatedAt: string;
}
