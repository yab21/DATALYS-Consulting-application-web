import { API_CONFIG, buildApiUrl, getDefaultHeaders, ApiResponse } from '@/lib/api-config';
import { UserRole } from '@/lib/permissions';

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: UserRole;
  partner_id?: number;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
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
      throw error;
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
    // Récupérer l'ID de l'admin depuis localStorage ou utiliser la valeur par défaut
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
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
    // Récupérer l'ID de l'admin depuis localStorage ou utiliser la valeur par défaut
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
      },
      datas: [userData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.USERS.UPDATE,
      'POST',
      requestBody
    );
  }

  // Méthode helper pour récupérer l'ID de l'utilisateur connecté
  private static getCurrentUserId(): number | null {
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

  // Méthode spécifique pour désactiver/activer un utilisateur
  static async toggleUserStatus(userId: number, isActive: boolean): Promise<any> {
    const updateData: UpdateUserData = {
      id: userId,
      is_active: isActive
    };
    
    return this.updateUser(updateData);
  }
}