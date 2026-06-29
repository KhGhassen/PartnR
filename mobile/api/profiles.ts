import client from './client';

export type Profile = {
  id: string;
  firstName: string;
  city: string;
  bio: string | null;
  avatarUrl: string | null;
  favoriteActivities: string[];
  profileType: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
};

export const getProfile = (id: string) =>
  client.get<Profile>(`/profiles/${id}`).then((r) => r.data);

export const updateMyProfile = (data: Partial<Pick<Profile, 'bio' | 'city' | 'favoriteActivities' | 'profileType'>>) =>
  client.put<Profile>('/profiles/me', data).then((r) => r.data);
