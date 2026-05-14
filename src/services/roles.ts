import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '@/lib/api-config';
import { extractBackendMessage } from '@/lib/error-handler';
import { isTokenExpiredError } from '@/lib/api-interceptor';

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  is_active: boolean;
}

export interface UpdateRoleData {
  id: number;
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface RoleCriteria {
  index?: number;
  size?: number;
  data?: {
    name?: string;
    is_active?: boolean;
  };
}

export class RolesService {
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

  static async getRolesByCriteria(criteria: RoleCriteria = {}): Promise<any> {
    const requestBody = {
      index: criteria.index || 0,
      size: criteria.size || 50,
      data: criteria.data || {}
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.ROLES.GET_BY_CRITERIA,
      'POST',
      requestBody
    );
  }

  static async createRole(roleData: CreateRoleData, adminId?: number): Promise<any> {
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
      },
      datas: [roleData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.ROLES.CREATE,
      'POST',
      requestBody
    );
  }

  static async updateRole(roleData: UpdateRoleData, adminId?: number): Promise<any> {
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
      },
      datas: [roleData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.ROLES.UPDATE,
      'POST',
      requestBody
    );
  }

  static async deleteRole(roleId: number): Promise<any> {
    const requestBody = {
      datas: [
        { id: roleId }
      ]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.ROLES.DELETE,
      'POST',
      requestBody
    );
  }

  // Méthode spécifique pour activer/désactiver un rôle
  static async toggleRoleStatus(roleId: number, isActive: boolean): Promise<any> {
    const updateData: UpdateRoleData = {
      id: roleId,
      is_active: isActive
    };
    
    return this.updateRole(updateData);
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
}