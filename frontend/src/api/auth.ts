import api from './client';
import type { AuthResponse } from '../types';

export const register = (data: { firstName: string; email: string; password: string; city: string }) =>
  api.post<AuthResponse>('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const confirmEmail = (data: { userId: string; token: string }) =>
  api.post('/auth/confirm-email', data).then((r) => r.data);

export const resendConfirmation = (email: string) =>
  api.post('/auth/resend-confirmation', { email }).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (data: { email: string; token: string; newPassword: string }) =>
  api.post('/auth/reset-password', data).then((r) => r.data);

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', data).then((r) => r.data);
