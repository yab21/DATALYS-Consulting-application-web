// Configuration API pour DATALYS Consulting
import { SecureStorage } from '@/lib/secure-storage';

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy',
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_TEMP_PASSWORD: '/auth/change-temp-password',
      VERIFY_MFA: '/auth/verify-mfa',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/update',
      CHANGE_PASSWORD: '/user/change-password',
    },
    PROJECTS: {
      LIST: '/projects',
      CREATE: '/projects',
      UPDATE: '/projects',
      DELETE: '/projects',
      GET: '/projects',
    },
    PARTNERS: {
      LIST: '/partners',
      CREATE: '/partners',
      UPDATE: '/partners',
      DELETE: '/partners',
      GET: '/partners',
    },
    FILES: {
      UPLOAD: '/files/upload',
      LIST: '/files',
      DELETE: '/files',
      DOWNLOAD: '/files/download',
    },
    SEARCH: {
      GLOBAL: '/search/global',
      SUGGESTIONS: '/search/suggestions',
      SAVED: '/search/saved',
    },
    USERS: {
      GET_BY_CRITERIA: '/users/getByCriteria',
      CREATE: '/users/create',
      UPDATE: '/users/update',
      DELETE: '/users/delete',
    },
    ROLES: {
      GET_BY_CRITERIA: '/roles/getByCriteria',
      CREATE: '/roles/create',
      UPDATE: '/roles/update',
      DELETE: '/roles/delete',
    },
    PERMISSIONS: {
      GET_BY_CRITERIA: '/user_project_permissions/getByCriteria',
      CREATE: '/user_project_permissions/create',
      UPDATE: '/user_project_permissions/update',
      DELETE: '/user_project_permissions/delete',
    },
    INCIDENTS: {
      GET_BY_CRITERIA: '/incidents/getByCriteria',
      CREATE: '/incidents/create',
      UPDATE: '/incidents/update',
      DELETE: '/incidents/delete',
    }
  }
} as const;

// Helper function pour construire les URLs complètes
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Configuration des headers par défaut
export const getDefaultHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Ajouter le token d'authentification s'il existe
  if (typeof window !== 'undefined') {
    const token = SecureStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Types pour les réponses API
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

export interface LoginResponse {
  // Champs de base présents après MFA
  id?: number;
  name?: string;
  email: string;
  username?: string;
  token?: string;
  role_id?: number;
  partner_id?: number; // ID du partenaire associé (pour les clients/partenaires)
  is_active?: boolean;
  is_deleted?: boolean;
  is_temp_password?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  client_code?: string | null;
  fcm_token?: string;
  
  // Champs de contrôle de flux
  requires_password_change?: boolean; // Indique si l'utilisateur doit changer son mot de passe
  requires_mfa?: boolean; // Indique si MFA est requis
  user_id?: number; // ID utilisateur pour étape MFA
  message?: string; // Message d'information (ex: "Code envoyé")
  
  // Note: password_hash est volontairement exclu pour la sécurité
}

export interface MFAVerificationRequest {
  identifier: string;
  mfa_code: string;
}

export interface MFAVerificationResponse {
  status: 'success' | 'error';
  message: string;
  remaining_attempts?: number;
  data?: LoginResponse; // Données complètes après vérification réussie
}