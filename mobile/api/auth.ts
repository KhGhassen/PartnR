import client from './client';

export type UserInfo = {
  id: string;
  firstName: string;
  email: string;
  avatarUrl: string | null;
  city: string;
  role: string;
};

export type AuthResponse = {
  token: string;
  expiresAt: string;
  user: UserInfo;
};

export const login = (data: { email: string; password: string }) =>
  client.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const register = (data: { firstName: string; email: string; password: string; city: string }) =>
  client.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const getMe = () =>
  client.get<UserInfo>('/auth/me').then((r) => r.data);

export const forgotPassword = (email: string) =>
  client.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (data: { email: string; token: string; newPassword: string }) =>
  client.post('/auth/reset-password', data).then((r) => r.data);
