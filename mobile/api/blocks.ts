import client from './client';

export type BlockedUser = {
  id: string;
  firstName: string;
  avatarUrl: string | null;
  blockedAt: string;
};

export const listBlockedUsers = () =>
  client.get<BlockedUser[]>('/blocks').then((r) => r.data);

export const blockUser = (userId: string) => client.post(`/blocks/${userId}`);

export const unblockUser = (userId: string) => client.delete(`/blocks/${userId}`);
