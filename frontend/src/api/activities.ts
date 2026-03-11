import api from './client';
import type { Activity } from '../types';

export const listActivities = () =>
  api.get<Activity[]>('/activities').then((r) => r.data);
