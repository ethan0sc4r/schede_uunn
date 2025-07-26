import axios, { AxiosError } from 'axios';
import {
  User,
  NavalUnit,
  Group,
  CreateNavalUnitRequest,
  CreateGroupRequest,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  SearchResponse,
  FileUploadResponse,
  ApiError,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth token management
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }
};

// Initialize token from localStorage
const storedToken = localStorage.getItem('auth_token');
if (storedToken) {
  setAuthToken(storedToken);
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Naval Units API
export const navalUnitsApi = {
  getAll: async (skip = 0, limit = 100): Promise<NavalUnit[]> => {
    const response = await api.get(`/api/units?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: number): Promise<NavalUnit> => {
    const response = await api.get(`/api/units/${id}`);
    return response.data;
  },

  create: async (unit: CreateNavalUnitRequest): Promise<NavalUnit> => {
    const response = await api.post('/api/units', unit);
    return response.data;
  },

  update: async (id: number, unit: Partial<CreateNavalUnitRequest>): Promise<NavalUnit> => {
    const response = await api.put(`/api/units/${id}`, unit);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/units/${id}`);
  },

  uploadLogo: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadSilhouette: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-silhouette`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadFlag: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-flag`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  search: async (query: string, searchType = 'all'): Promise<SearchResponse> => {
    const response = await api.get(`/api/units/search/?q=${encodeURIComponent(query)}&search_type=${searchType}`);
    return response.data;
  },

  exportPdf: async (id: number, groupId?: number): Promise<Blob> => {
    const url = groupId ? `/api/units/${id}/export/pdf?group_id=${groupId}` : `/api/units/${id}/export/pdf`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },

  exportPng: async (id: number, groupId?: number): Promise<Blob> => {
    const url = groupId ? `/api/units/${id}/export/png?group_id=${groupId}` : `/api/units/${id}/export/png`;
    const response = await api.get(url, { responseType: 'blob' });
    return response.data;
  },
};

// Groups API
export const groupsApi = {
  getAll: async (skip = 0, limit = 100): Promise<Group[]> => {
    const response = await api.get(`/api/groups?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: number): Promise<Group> => {
    const response = await api.get(`/api/groups/${id}`);
    return response.data;
  },

  create: async (group: CreateGroupRequest): Promise<Group> => {
    const response = await api.post('/api/groups', group);
    return response.data;
  },

  update: async (id: number, group: Partial<CreateGroupRequest>): Promise<Group> => {
    const response = await api.put(`/api/groups/${id}`, group);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/groups/${id}`);
  },

  uploadLogo: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/groups/${id}/upload-logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadFlag: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/groups/${id}/upload-flag`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Admin API
export const adminApi = {
  getAllUsers: async (skip = 0, limit = 100): Promise<User[]> => {
    const response = await api.get(`/api/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getPendingUsers: async (): Promise<User[]> => {
    const response = await api.get('/api/admin/users/pending');
    return response.data;
  },

  activateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/api/admin/users/${userId}/activate`);
    return response.data;
  },

  deactivateUser: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/api/admin/users/${userId}/deactivate`);
    return response.data;
  },

  makeAdmin: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/api/admin/users/${userId}/make-admin`);
    return response.data;
  },

  removeAdmin: async (userId: number): Promise<{ message: string }> => {
    const response = await api.post(`/api/admin/users/${userId}/remove-admin`);
    return response.data;
  },
};