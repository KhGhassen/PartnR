import api from './client';

export const listCities = () =>
  api.get<string[]>('/cities').then((r) => r.data);
