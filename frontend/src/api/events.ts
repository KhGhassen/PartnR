import api from './client';
import type { EventSummary, EventDetail, PaginatedResult } from '../types';

export const listEvents = (params?: {
  city?: string;
  activityId?: string;
  status?: string;
  mine?: boolean;
  page?: number;
  pageSize?: number;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}) =>
  api.get<PaginatedResult<EventSummary>>('/events', { params }).then((r) => r.data);

export const getEvent = (id: string) =>
  api.get<EventDetail>(`/events/${id}`).then((r) => r.data);

export const createEvent = (data: {
  title: string;
  description?: string;
  city: string;
  location?: string;
  date: string;
  maxParticipants: number;
  activityId: string;
  photoUrl?: string;
  latitude?: number;
  longitude?: number;
}) => api.post<EventDetail>('/events', data).then((r) => r.data);

export const updateEvent = (id: string, data: Record<string, unknown>) =>
  api.put<EventDetail>(`/events/${id}`, data).then((r) => r.data);

export const deleteEvent = (id: string) =>
  api.delete(`/events/${id}`);

export const joinEvent = (id: string) =>
  api.post(`/events/${id}/join`);

export const leaveEvent = (id: string) =>
  api.post(`/events/${id}/leave`);
