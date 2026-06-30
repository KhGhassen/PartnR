import client from './client';

export type EventSummary = {
  id: string;
  title: string;
  city: string;
  location: string | null;
  date: string;
  maxParticipants: number;
  status: string;
  activityName: string;
  activityIcon: string;
  creatorId: string;
  creatorName: string;
  participantCount: number;
  photoUrl: string | null;
};

export type Participant = {
  userId: string;
  firstName: string;
  avatarUrl: string | null;
  status: string;
};

export type EventPhoto = {
  id: string;
  eventId: string;
  url: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: string;
};

export type EventDetail = EventSummary & {
  description: string | null;
  createdAt: string;
  participants: Participant[];
  photos: EventPhoto[];
};

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export const listEvents = (params?: {
  city?: string;
  activityId?: string;
  status?: string;
  mine?: boolean;
  page?: number;
  pageSize?: number;
}) =>
  client.get<PaginatedResult<EventSummary>>('/events', { params }).then((r) => r.data);

export const getEvent = (id: string) =>
  client.get<EventDetail>(`/events/${id}`).then((r) => r.data);

export const createEvent = (data: {
  title: string;
  description?: string;
  city: string;
  location?: string;
  date: string;
  maxParticipants: number;
  activityId: string;
  photoUrl?: string;
}) => client.post<EventDetail>('/events', data).then((r) => r.data);

export const joinEvent = (id: string) =>
  client.post(`/events/${id}/join`);

export const leaveEvent = (id: string) =>
  client.post(`/events/${id}/leave`);
