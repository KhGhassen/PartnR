import api from './client';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  eventId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: NotificationItem[];
  unreadCount: number;
}

export const listNotifications = () =>
  api.get<NotificationList>('/notifications').then((r) => r.data);

export const markAllNotificationsRead = () =>
  api.post('/notifications/read-all');
