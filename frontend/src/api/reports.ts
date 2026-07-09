import api from './client';

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'event';
  targetId: string;
  targetLabel: string;
  reason: string;
  status: 'Pending' | 'Resolved';
  createdAt: string;
}

export const createReport = (data: { targetType: 'user' | 'event'; targetId: string; reason: string }) =>
  api.post('/reports', data);

export const listReports = () => api.get<Report[]>('/reports').then((r) => r.data);

export const resolveReport = (id: string) => api.post(`/reports/${id}/resolve`);
