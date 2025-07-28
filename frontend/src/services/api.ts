import axios, { AxiosError } from 'axios';
import type {
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
} from '../types/index.ts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export API_BASE_URL for static file URLs
export { API_BASE_URL };

// Auth token management
export const setAuthToken = (token: string | null) => {
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

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
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
    const response = await api.post(`/api/units/${id}/upload-logo`, formData);
    return response.data;
  },

  uploadSilhouette: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-silhouette`, formData);
    return response.data;
  },

  uploadFlag: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/units/${id}/upload-flag`, formData);
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

  // Template state management
  saveTemplateState: async (unitId: number, templateId: string, stateData: any): Promise<void> => {
    await api.post(`/api/units/${unitId}/template-states/${templateId}`, stateData);
  },

  getTemplateState: async (unitId: number, templateId: string): Promise<any> => {
    const response = await api.get(`/api/units/${unitId}/template-states/${templateId}`);
    return response.data;
  },

  getAllTemplateStates: async (unitId: number): Promise<any> => {
    const response = await api.get(`/api/units/${unitId}/template-states`);
    return response.data;
  },

  // Public endpoint for viewing units (no authentication required)
  getByIdPublic: async (id: number): Promise<NavalUnit> => {
    const response = await axios.get(`${API_BASE_URL}/api/public/units/${id}`);
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
    const response = await api.post(`/api/groups/${id}/upload-logo`, formData);
    return response.data;
  },

  uploadFlag: async (id: number, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/groups/${id}/upload-flag`, formData);
    return response.data;
  },

  exportPowerPoint: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/groups/${id}/export/powerpoint`, { 
      responseType: 'blob' 
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

  // Password management
  changeUserPassword: async (userId: number, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post(`/api/admin/users/${userId}/change-password`, {
      new_password: newPassword
    });
    return response.data;
  },

  changeOwnPassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/api/admin/change-own-password', {
      current_password: currentPassword,
      new_password: newPassword
    });
    return response.data;
  },
};

// Templates API
export const templatesApi = {
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  getById: async (id: string): Promise<any> => {
    const response = await api.get(`/api/templates/${id}`);
    return response.data;
  },

  create: async (templateData: any): Promise<{ message: string; template_id: string }> => {
    const response = await api.post('/api/templates', templateData);
    return response.data;
  },

  update: async (id: string, templateData: any): Promise<{ message: string }> => {
    const response = await api.put(`/api/templates/${id}`, templateData);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/api/templates/${id}`);
    return response.data;
  },
};