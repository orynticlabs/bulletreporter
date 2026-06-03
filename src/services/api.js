import axios from 'axios';
import config from '@/config/config.js';

const API_URL = config.API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 20000, // 20 seconds - Render free tier cold start le leta hai
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('userInfo') || 'null');
      if (user && user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('Request timeout - Backend server (Render) may be starting up. Please retry.');
    }
    return Promise.reject(error);
  }
);

export default api;

export const fetchNews = async () => {
  const response = await api.get('/news');
  return response.data;
};

export const fetchArticleById = async (id) => {
  const response = await api.get(`/news/${id}`);
  return response.data;
};

export const searchNews = async (query) => {
  const response = await api.get(`/search?q=${query}`);
  return response.data;
};
