import api from './client';

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  isOrganizer: boolean;
  content: string;
  createdAt: string;
}

export const listEventComments = (eventId: string) =>
  api.get<EventComment[]>(`/events/${eventId}/comments`).then((r) => r.data);

export const addEventComment = (eventId: string, content: string) =>
  api.post<EventComment>(`/events/${eventId}/comments`, { content }).then((r) => r.data);

export const deleteEventComment = (eventId: string, commentId: string) =>
  api.delete(`/events/${eventId}/comments/${commentId}`);
