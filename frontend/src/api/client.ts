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
    return {
      status: 0,
      message: 'Impossible de contacter le serveur. Vérifiez votre connexion.',
      isNetworkError: true,
      isTimeout: axiosErr.code === 'ECONNABORTED',
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
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
