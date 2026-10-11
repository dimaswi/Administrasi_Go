import axios from 'axios';

// Base URL detection:
// - If VITE_API_URL is explicitly set, use it.
// - In dev (Vite proxy) & prod (Nginx reverse proxy), relative '' ensures seamless access from desktop, mobile LAN, and tunnels.
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL 
    ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL.slice(0, -4) : import.meta.env.VITE_API_URL)
    : '';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api` : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
