import api from './client';

export interface BlockedUser {
  id: string;
  firstName: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export const listBlockedUsers = () => api.get<BlockedUser[]>('/blocks').then((r) => r.data);

export const blockUser = (userId: string) => api.post(`/blocks/${userId}`);

export const unblockUser = (userId: string) => api.delete(`/blocks/${userId}`);
