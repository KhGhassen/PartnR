import client from './client';

export const listCities = () =>
  client.get<string[]>('/cities').then((r) => r.data);
