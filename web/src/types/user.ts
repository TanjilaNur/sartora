export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  hasGoogleAccount?: boolean;
  notificationsEnabled?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export interface AddressInput {
  label?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}
