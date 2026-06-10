import api from './client';
import type { AdminUser, PaginatedResult } from '../types';

export const listUsers = (params?: { search?: string; page?: number; pageSize?: number }) =>
  api.get<PaginatedResult<AdminUser>>('/admin/users', { params }).then((r) => r.data);

export const banUser = (id: string) =>
  api.post<AdminUser>(`/admin/users/${id}/ban`).then((r) => r.data);

export const unbanUser = (id: string) =>
  api.post<AdminUser>(`/admin/users/${id}/unban`).then((r) => r.data);
