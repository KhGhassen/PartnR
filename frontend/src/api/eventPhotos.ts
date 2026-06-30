import api from './client';
import type { EventPhoto } from '../types';

export const addEventPhoto = (eventId: string, data: { url: string }) =>
  api.post<EventPhoto>(`/events/${eventId}/photos`, data).then((r) => r.data);

export const deleteEventPhoto = (eventId: string, photoId: string) =>
  api.delete(`/events/${eventId}/photos/${photoId}`);
