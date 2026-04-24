import client from './client';
import type { AnalyticsDashboard } from '../types';

export interface TrackActionPayload {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: string;
}

export function trackAction(payload: TrackActionPayload): void {
  client.post('/analytics/track', payload).catch(() => {});
}

export async function getDashboard(): Promise<AnalyticsDashboard> {
  const res = await client.get<AnalyticsDashboard>('/analytics/dashboard');
  return res.data;
}
