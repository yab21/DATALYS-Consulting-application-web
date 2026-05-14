import { API_CONFIG, buildApiUrl, getDefaultHeaders, ApiResponse } from '@/lib/api-config';
import { UserRole } from '@/lib/permissions';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number; // 1 = admin, 2 = manager, 3 = user, 4 = partner
  partner_id?: number;
  is_active: boolean;
  is_deleted?: boolean;
  is_temp_password?: boolean;
  client_code?: string;
  username?: string;
  fcm_token?: string;
  password_hash?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  partner_name?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role_name: string; // L'API utilise role_name au lieu de role_id
  partner_id?: number;
  is_active: boolean;
}

export interface UpdateUserData {
  id: number;
  name?: string;
  email?: string;
  role_name?: string;
  partner_id?: number;
  is_active?: boolean;
  password?: string; // Pour changer le mot de passe
}

export interface ChangePasswordData {
  id: number;
  current_password: string;
  new_password: string;
}

export interface UserCriteria {
  index?: number;
  size?: number;
  data?: {
    name?: string;
    email?: string;
    role_name?: string;
    partner_id?: number;
    is_active?: boolean;
  };
}

export class UsersService {
  private static async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: getDefaultHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  static async getUsersByCriteria(criteria: UserCriteria = {}): Promise<any> {
    // Format par défaut si pas de critères spécifiés
    const requestBody = {
      index: criteria.index || 0,
      size: criteria.size || 50,
      data: criteria.data || {}
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.GET_BY_CRITERIA,
      'POST',
      requestBody
    );
  }

  static async createUser(userData: CreateUserData, adminId?: number): Promise<any> {
    // Récupérer l'ID et l'email de l'admin depuis localStorage
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    const requestBody = {
      user: {
        id: adminId || currentUser.id,
        email: currentUser.email
      },
      datas: [userData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.CREATE,
      'POST',
      requestBody
    );
  }

  static async updateUser(userData: UpdateUserData, adminId?: number): Promise<any> {
    // Récupérer l'ID et l'email de l'admin depuis localStorage
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    const requestBody = {
      user: {
        id: adminId || currentUser.id,
        email: currentUser.email
      },
      datas: [userData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.UPDATE,
      'POST',
      requestBody
    );
  }


  static async deleteUser(userId: number): Promise<any> {
    // Format API avec datas array
    const requestBody = {
      datas: [
        { id: userId }
      ]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.DELETE,
      'POST',
      requestBody
    );
  }

  // Récupérer un utilisateur par ID
  static async getUserById(userId: number): Promise<User | null> {
    try {
      const criteria: UserCriteria = {
        index: 0,
        size: 1000, // Grande taille pour être sûr de récupérer l'utilisateur
        data: {}
      };

      const response = await this.getUsersByCriteria(criteria);
      const users = response.items || response.data || [];
      
      const user = users.find((u: User) => u.id === userId);
      return user || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur par ID:', error);
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Méthode spécifique pour désactiver/activer un utilisateur
  static async toggleUserStatus(userId: number, isActive: boolean): Promise<any> {
    const updateData: UpdateUserData = {
      id: userId,
      is_active: isActive
    };
    
    return this.updateUser(updateData);
  }

  // Méthode pour changer le mot de passe via users/update
  static async changePassword(passwordData: ChangePasswordData): Promise<any> {
    // Récupérer l'ID de l'utilisateur connecté
    const currentUserId = this.getCurrentUserId();
    
    if (!currentUserId) {
      throw new Error('Utilisateur non connecté');
    }

    // Vérifier que l'utilisateur change son propre mot de passe
    if (passwordData.id !== currentUserId) {
      throw new Error('Vous ne pouvez changer que votre propre mot de passe');
    }

    const updateData: UpdateUserData = {
      id: passwordData.id,
      password: passwordData.new_password
    };

    const requestBody = {
      user: {
        id: currentUserId
      },
      datas: [updateData],
      // Inclure le mot de passe actuel pour validation
      current_password: passwordData.current_password
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.UPDATE,
      'POST',
      requestBody
    );
  }

  // Méthode helper pour récupérer l'ID de l'utilisateur connecté (rendre publique)
  static getCurrentUserId(): number | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.id;
        } catch (error) {
          console.error('Erreur lors de la lecture des données utilisateur:', error);
        }
      }
    }
    return null;
  }

  // Nouvelle méthode pour récupérer l'utilisateur complet
  static getCurrentUser(): { id: number; email: string } | null {
    if (typeof window !== 'undefined') {
      try {
        // Utiliser SecureStorage comme dans AuthContext
        const { SecureStorage } = require('@/lib/secure-storage');
        const userStr = SecureStorage.getItem('userInfo');
        if (userStr) {
          const user = JSON.parse(userStr);
          return { id: user.id, email: user.email };
        }
      } catch (error) {
        console.error('Erreur lors de la lecture des données utilisateur:', error);
      }
    }
    return null;
  }
}