import axios from 'axios';

// デバッグ用ログ
console.log('[API Config] VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('[API Config] MODE:', import.meta.env.MODE);

const baseURL = import.meta.env.VITE_API_URL || 'https://menya-nishiki-system-cloud.onrender.com/api';
console.log('[API Config] Using baseURL:', baseURL);

const api = axios.create({
  baseURL: baseURL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
