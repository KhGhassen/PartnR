import client from './client';

export type Activity = {
  id: string;
  name: string;
  slug: string;
  icon: string;
};

export const listActivities = () =>
  client.get<Activity[]>('/activities').then((r) => r.data);
