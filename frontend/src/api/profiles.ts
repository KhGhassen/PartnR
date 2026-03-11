import api from './client';
import type { Profile } from '../types';

export const getProfile = (id: string) =>
  api.get<Profile>(`/profiles/${id}`).then((r) => r.data);

export const updateMyProfile = (data: Partial<Profile>) =>
  api.put<Profile>('/profiles/me', data).then((r) => r.data);

export const searchProfiles = (params?: { city?: string; activity?: string }) =>
  api.get<Profile[]>('/profiles', { params }).then((r) => r.data);
