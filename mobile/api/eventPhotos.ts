import client from './client';
import type { EventPhoto } from './events';

export const addEventPhoto = (eventId: string, data: { url: string }) =>
  client.post<EventPhoto>(`/events/${eventId}/photos`, data).then((r) => r.data);

export const deleteEventPhoto = (eventId: string, photoId: string) =>
  client.delete(`/events/${eventId}/photos/${photoId}`);
