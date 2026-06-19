import api from './client';
import type { AdminEvent, AdminUser, PaginatedResult } from '../types';

export const listUsers = (params?: { search?: string; page?: number; pageSize?: number }) =>
  api.get<PaginatedResult<AdminUser>>('/admin/users', { params }).then((r) => r.data);

export const banUser = (id: string) =>
  api.post<AdminUser>(`/admin/users/${id}/ban`).then((r) => r.data);

export const unbanUser = (id: string) =>
  api.post<AdminUser>(`/admin/users/${id}/unban`).then((r) => r.data);

export const listEvents = (params?: { search?: string; status?: string; page?: number; pageSize?: number }) =>
  api.get<PaginatedResult<AdminEvent>>('/admin/events', { params }).then((r) => r.data);

export const cancelEvent = (id: string) =>
  api.post<AdminEvent>(`/admin/events/${id}/cancel`).then((r) => r.data);

export const deleteEvent = (id: string) =>
  api.delete(`/admin/events/${id}`).then((r) => r.data);
