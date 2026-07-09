import client from './client';

export type EventComment = {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  isOrganizer: boolean;
  content: string;
  createdAt: string;
};

export const listEventComments = (eventId: string) =>
  client.get<EventComment[]>(`/events/${eventId}/comments`).then((r) => r.data);

export const addEventComment = (eventId: string, content: string) =>
  client.post<EventComment>(`/events/${eventId}/comments`, { content }).then((r) => r.data);

export const deleteEventComment = (eventId: string, commentId: string) =>
  client.delete(`/events/${eventId}/comments/${commentId}`);
