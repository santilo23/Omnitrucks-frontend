import axios from 'axios';
import { env } from '@/config/env';

/**
 * Cliente HTTP base configurado con la URL del backend.
 */
export const clienteApi = axios.create({
  baseURL: env.apiUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
