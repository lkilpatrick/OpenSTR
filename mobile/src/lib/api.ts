import axios, { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, clearAccessToken } from './storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 15000,
});

let onUnauthenticated: (() => void) | null = null;

export function setOnUnauthenticated(cb: () => void): void {
  onUnauthenticated = cb;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAccessToken();
      onUnauthenticated?.();
    }
    return Promise.reject(error);
  }
);
