import axios from 'axios';

const authClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1/auth',
  headers: { 'Content-Type': 'application/json' },
});

const backendBaseUrl = 'http://localhost:8080';

export type Role = 'USER' | 'ADMIN';

export type AuthUser = {
  id: string;
  publicId?: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    authClient.post<AuthResponse>('/register', payload).then((res) => res.data),
  login: (payload: { email: string; password: string }) =>
    authClient.post<AuthResponse>('/login', payload).then((res) => res.data),
  refresh: (refreshToken: string) =>
    authClient.post<AuthResponse>('/refresh', { refreshToken }).then((res) => res.data),
  logout: (refreshToken: string) =>
    authClient.post('/logout', { refreshToken }).then((res) => res.data),
  verifyEmail: (token: string) =>
    authClient.post('/verify-email', { token }).then((res) => res.data),
  forgotPassword: (email: string) =>
    authClient.post('/forgot-password', { email }).then((res) => res.data),
  resetPassword: (payload: { token: string; password: string }) =>
    authClient.post('/reset-password', payload).then((res) => res.data),
  oauthUrl: (provider: 'google' | 'github') => `${backendBaseUrl}/oauth2/authorization/${provider}`,
};
