/**
 * api.js — Axios instance for the Oma Midas API.
 * Base URL from VITE_API_URL env var (defaults to '' for Vite proxy).
 * Automatically redirects to /login on 401.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor — redirect to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** GET with optional query params */
export const get = (url, params) => api.get(url, { params });

/** POST with body data */
export const post = (url, data) => api.post(url, data);

/** PUT with body data */
export const put = (url, data) => api.put(url, data);

/** DELETE */
export const del = (url) => api.delete(url);

export default api;
