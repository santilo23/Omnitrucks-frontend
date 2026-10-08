import axios from 'axios';
import { env } from '@/config/env';
import { storage } from '@/lib/storage';

export const TOKEN_STORAGE_KEY = 'omnitrucks_auth_token';
export const USER_STORAGE_KEY = 'omnitrucks_auth_user';

/**
 * Cliente HTTP base configurado con la URL del backend y token JWT automático.
 */
export const clienteApi = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

clienteApi.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

