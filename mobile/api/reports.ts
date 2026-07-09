import client from './client';

export const createReport = (data: { targetType: 'user' | 'event'; targetId: string; reason: string }) =>
  client.post('/reports', data);
