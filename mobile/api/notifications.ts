import client from './client';

export type NotificationItem = {
  id: string;
  type: string;
  message: string;
  eventId: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationList = {
  items: NotificationItem[];
  unreadCount: number;
};

export const listNotifications = () =>
  client.get<NotificationList>('/notifications').then((r) => r.data);

export const markAllNotificationsRead = () =>
  client.post('/notifications/read-all');
