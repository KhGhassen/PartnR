import axios, { type AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const client = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Reads outlive Render's ~30 s cold start; mutations keep the short budget
  // so a slow POST cannot be double-submitted.
  if ((config.method ?? 'get').toLowerCase() === 'get') config.timeout = 45000;
  return config;
});

// One cheap /health call per app launch, so the API is warm before the first
// screen asks for data. Never rejects.
let awake: Promise<void> | null = null;
export function ensureAwake(): Promise<void> {
  if (!awake) {
    awake = client.get('/health', { timeout: 60000 }).then(() => undefined).catch(() => undefined);
  }
  return awake;
}

client.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(err);
  }
);

export interface ApiError {
  status: number;
  message: string;
}

export function toApiError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) return { status: 0, message: 'Erreur inconnue' };
  if (err.code === 'ECONNABORTED') return { status: 0, message: 'Le serveur se réveille — encore quelques secondes, puis réessayez.' };
  if (err.code === 'ERR_NETWORK') return { status: 0, message: 'Impossible de contacter le serveur. Vérifiez votre connexion.' };
  const status = err.response?.status ?? 0;
  const msg = (err.response?.data as any)?.error;
  const defaults: Record<number, string> = {
    400: 'Requête invalide.',
    401: 'Session expirée.',
    403: 'Action non autorisée.',
    404: 'Introuvable.',
    500: 'Erreur serveur.',
  };
  return { status, message: msg || defaults[status] || `Erreur ${status}` };
}

export default client;
