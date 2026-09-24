import axios, { type AxiosError } from 'axios';

export interface ApiError {
  status: number;
  message: string;
  isNetworkError: boolean;
  isTimeout: boolean;
}

export function toApiError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return { status: 0, message: 'Erreur inconnue', isNetworkError: false, isTimeout: false };
  }

  const axiosErr = err as AxiosError<{ error?: string }>;

  if (axiosErr.code === 'ECONNABORTED' || axiosErr.code === 'ERR_NETWORK') {
    const isTimeout = axiosErr.code === 'ECONNABORTED';
    return {
      status: 0,
      // The old copy blamed the user's connection. On the Render free tier the
      // usual cause is our own cold start, so say that instead.
      message: isTimeout
        ? 'Le serveur se réveille — encore quelques secondes, puis réessayez.'
        : 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      isNetworkError: true,
      isTimeout,
    };
  }

  const status = axiosErr.response?.status ?? 0;
  const serverMessage = axiosErr.response?.data?.error;

  const defaultMessages: Record<number, string> = {
    400: 'Requête invalide.',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Vous n\'avez pas la permission d\'effectuer cette action.',
    404: 'Ressource introuvable.',
    429: 'Trop de requêtes. Veuillez patienter.',
    500: 'Erreur serveur. Veuillez réessayer plus tard.',
  };

  return {
    status,
    message: serverMessage || defaultMessages[status] || `Erreur ${status}`,
    isNetworkError: false,
    isTimeout: false,
  };
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 15 s is shorter than Render's ~30 s cold start, so the very first visit of
  // the day used to fail with a network error. Reads get the long budget;
  // mutations keep the short one so a slow POST cannot be double-submitted.
  if ((config.method ?? 'get').toLowerCase() === 'get') {
    config.timeout = 45000;
  }
  return config;
});

// Memoised wake-up gate: one cheap /health call per page load, started as
// early as possible, so the API is warm by the time the first real request
// leaves. Never rejects — a failed ping just means the next request waits.
let awake: Promise<void> | null = null;
export function ensureAwake(): Promise<void> {
  if (!awake) {
    awake = api
      .get('/health', { timeout: 60000 })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return awake;
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default api;
