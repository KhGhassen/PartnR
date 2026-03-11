import api from './client';
import type { Rating } from '../types';

export const createRating = (eventId: string, data: { ratedUserId: string; score: number; comment?: string }) =>
  api.post<Rating>(`/events/${eventId}/ratings`, data).then((r) => r.data);

export const getUserRatings = (eventId: string, userId: string) =>
  api.get<Rating[]>(`/events/${eventId}/ratings/user/${userId}`).then((r) => r.data);
