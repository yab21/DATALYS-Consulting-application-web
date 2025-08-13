/**
 * Service API centralisé pour l'application DATALYS Consulting
 * Architecture préparée pour l'intégration backend
 */

import { z } from 'zod';

// Types et schemas de validation
export const ApiResponseSchema = z.object({
  data: z.any(),
  message: z.string(),
  status: z.enum(['success', 'error']),
  timestamp: z.string(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }).optional(),
});

export type ApiResponse<T = any> = z.infer<typeof ApiResponseSchema> & {
  data: T;
};

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Configuration de base
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Service API de base avec gestion d'erreurs et retry automatique
 */
export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_CONFIG.baseURL;
    this.defaultHeaders = { ...API_CONFIG.headers };
  }

  /**
   * Configuration du token d'authentification
   */
  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Gestion des erreurs HTTP
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    let data: any;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new ApiError(
        data.message || `HTTP ${response.status}`,
        response.status,
        data
      );
      throw error;
    }

    // Validation de la réponse
    try {
      return ApiResponseSchema.parse(data) as ApiResponse<T>;
    } catch (validationError) {
      console.warn('Réponse API non conforme au schema:', validationError);
      // Fallback pour les APIs qui ne suivent pas le schema
      return {
        data,
        message: 'Success',
        status: 'success',
        timestamp: new Date().toISOString(),
      } as ApiResponse<T>;
    }
  }

  /**
   * Méthode générique pour les requêtes avec retry
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = API_CONFIG.timeout,
      retries = API_CONFIG.retries,
      retryDelay = API_CONFIG.retryDelay,
      headers = {},
      params,
      ...fetchOptions
    } = options;

    // Construction de l'URL avec paramètres
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    // Headers finaux
    const finalHeaders = {
      ...this.defaultHeaders,
      ...headers,
    };

    // Configuration fetch avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: finalHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);

      } catch (error) {
        lastError = error as Error;
        
        // Ne pas retry sur certaines erreurs
        if (error instanceof ApiError && error.status < 500) {
          throw error;
        }

        // Dernière tentative
        if (attempt === retries) {
          break;
        }

        // Attendre avant le retry
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    clearTimeout(timeoutId);
    throw lastError!;
  }

  /**
   * Méthodes HTTP de base
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', ...config });
  }

  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async put<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async patch<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', ...config });
  }

  /**
   * Upload de fichiers avec progression
   */
  async upload<T>(
    endpoint: string,
    file: File | FormData,
    onProgress?: (progress: UploadProgress) => void,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Configuration du progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            onProgress(progress);
          }
        });
      }

      // Configuration de la réponse
      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
              const [key, value] = line.split(': ');
              if (key && value) headers[key] = value;
              return headers;
            }, {} as Record<string, string>)),
          });

          const result = await this.handleResponse<T>(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError('Upload failed', 0));
      });

      xhr.addEventListener('timeout', () => {
        reject(new ApiError('Upload timeout', 0));
      });

      // Configuration et envoi
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Headers (sans Content-Type pour FormData)
      const headers = { ...this.defaultHeaders, ...config?.headers };
      delete headers['Content-Type']; // Laissé au navigateur pour FormData
      
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.timeout = config?.timeout || API_CONFIG.timeout;
      xhr.send(formData);
    });
  }
}

/**
 * Classe d'erreur personnalisée pour les APIs
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}

// Instance par défaut
export const apiService = new ApiService();

/**
 * Service spécialisé pour l'authentification
 */
export class AuthService extends ApiService {
  async login(email: string, password: string) {
    const response = await this.post('/auth/login', { email, password });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.setAuthToken(null);
    }
  }

  async refreshToken() {
    const response = await this.post('/auth/refresh');
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response;
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async resetPassword(email: string) {
    return this.post('/auth/reset-password', { email });
  }
}

/**
 * Service pour la gestion des projets
 */
export class ProjectService extends ApiService {
  async getProjects(params?: { page?: number; limit?: number; search?: string }) {
    return this.get('/projects', { params });
  }

  async getProject(id: string) {
    return this.get(`/projects/${id}`);
  }

  async createProject(data: any) {
    return this.post('/projects', data);
  }

  async updateProject(id: string, data: any) {
    return this.put(`/projects/${id}`, data);
  }

  async deleteProject(id: string) {
    return this.delete(`/projects/${id}`);
  }

  async getProjectFiles(projectId: string, path: string = '/') {
    return this.get(`/projects/${projectId}/files`, { params: { path } });
  }

  async uploadFile(projectId: string, file: File, path: string = '/', onProgress?: (progress: UploadProgress) => void) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);
    
    return this.upload(`/projects/${projectId}/files`, formData, onProgress);
  }

  async deleteFile(projectId: string, fileId: string) {
    return this.delete(`/projects/${projectId}/files/${fileId}`);
  }

  async createFolder(projectId: string, name: string, parentPath: string = '/') {
    return this.post(`/projects/${projectId}/folders`, { name, parentPath });
  }
}

/**
 * Service pour la gestion des partenaires
 */
export class PartnerService extends ApiService {
  async getPartners(params?: { page?: number; limit?: number; search?: string; sector?: string }) {
    return this.get('/partners', { params });
  }

  async getPartner(id: string) {
    return this.get(`/partners/${id}`);
  }

  async createPartner(data: any) {
    return this.post('/partners', data);
  }

  async updatePartner(id: string, data: any) {
    return this.put(`/partners/${id}`, data);
  }

  async deletePartner(id: string) {
    return this.delete(`/partners/${id}`);
  }

  async getPartnerProjects(partnerId: string) {
    return this.get(`/partners/${partnerId}/projects`);
  }

  async getPartnerIncidents(partnerId: string) {
    return this.get(`/partners/${partnerId}/incidents`);
  }

  async createIncident(partnerId: string, data: any) {
    return this.post(`/partners/${partnerId}/incidents`, data);
  }
}

/**
 * Service pour les utilisateurs et permissions
 */
export class UserService extends ApiService {
  async getUsers(params?: { page?: number; limit?: number; search?: string; role?: string }) {
    return this.get('/users', { params });
  }

  async getUser(id: string) {
    return this.get(`/users/${id}`);
  }

  async createUser(data: any) {
    return this.post('/users', data);
  }

  async updateUser(id: string, data: any) {
    return this.put(`/users/${id}`, data);
  }

  async deleteUser(id: string) {
    return this.delete(`/users/${id}`);
  }

  async updateUserPermissions(id: string, permissions: string[]) {
    return this.patch(`/users/${id}/permissions`, { permissions });
  }

  async getUserActivity(id: string, params?: { from?: string; to?: string }) {
    return this.get(`/users/${id}/activity`, { params });
  }
}

/**
 * Service pour les analytics
 */
export class AnalyticsService extends ApiService {
  async getMetrics(timeRange: string = '30d') {
    return this.get('/analytics/metrics', { params: { timeRange } });
  }

  async getChartData(chartId: string, timeRange: string = '30d') {
    return this.get(`/analytics/charts/${chartId}`, { params: { timeRange } });
  }

  async exportData(type: string, timeRange: string = '30d', format: string = 'json') {
    return this.get('/analytics/export', { 
      params: { type, timeRange, format },
    });
  }

  async getSystemHealth() {
    return this.get('/analytics/health');
  }
}

// Instances des services spécialisés
export const authService = new AuthService();
export const projectService = new ProjectService();
export const partnerService = new PartnerService();
export const userService = new UserService();
export const analyticsService = new AnalyticsService();

/**
 * Configuration globale des services avec token
 */
export const configureServices = (token: string | null) => {
  [authService, projectService, partnerService, userService, analyticsService].forEach(service => {
    service.setAuthToken(token);
  });
};

/**
 * Middleware de gestion d'erreurs global
 */
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 400:
        return 'Données invalides';
      case 401:
        return 'Session expirée, veuillez vous reconnecter';
      case 403:
        return 'Accès non autorisé';
      case 404:
        return 'Ressource introuvable';
      case 409:
        return 'Conflit de données';
      case 422:
        return 'Données non valides';
      case 429:
        return 'Trop de requêtes, veuillez patienter';
      case 500:
        return 'Erreur serveur, veuillez réessayer';
      case 503:
        return 'Service temporairement indisponible';
      default:
        return error.message || 'Erreur de communication';
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'Erreur inconnue';
};