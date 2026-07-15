export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AdminUser;
}

export interface AuthState {
  user: AdminUser | null;
  token: string | null;
  refreshToken: string | null;
}
