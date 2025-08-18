import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '@/lib/api-config';

export interface UserProjectPermission {
  id: number;
  user_id: number;
  project_id: number;
  permission_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
  // Relations
  user_name?: string;
  project_name?: string;
}

export interface CreatePermissionData {
  user_id: number;
  project_id: number;
  permission_type: string;
  is_active: boolean;
}

export interface UpdatePermissionData {
  id: number;
  user_id?: number;
  project_id?: number;
  permission_type?: string;
  is_active?: boolean;
}

export interface PermissionCriteria {
  index?: number;
  size?: number;
  data?: {
    user_id?: number;
    project_id?: number;
    permission_type?: string;
    is_active?: boolean;
  };
}

export class PermissionsService {
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

  static async getPermissionsByCriteria(criteria: PermissionCriteria = {}): Promise<any> {
    const requestBody = {
      index: criteria.index || 0,
      size: criteria.size || 50,
      data: criteria.data || {}
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.PERMISSIONS.GET_BY_CRITERIA,
      'POST',
      requestBody
    );
  }

  static async createPermission(permissionData: CreatePermissionData, adminId?: number): Promise<any> {
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
      },
      datas: [permissionData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.PERMISSIONS.CREATE,
      'POST',
      requestBody
    );
  }

  static async updatePermission(permissionData: UpdatePermissionData, adminId?: number): Promise<any> {
    const userId = adminId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: userId
      },
      datas: [permissionData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.PERMISSIONS.UPDATE,
      'POST',
      requestBody
    );
  }

  static async deletePermission(permissionId: number): Promise<any> {
    const requestBody = {
      datas: [
        { id: permissionId }
      ]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.PERMISSIONS.DELETE,
      'POST',
      requestBody
    );
  }

  // Méthode spécifique pour activer/désactiver une permission
  static async togglePermissionStatus(permissionId: number, isActive: boolean): Promise<any> {
    const updateData: UpdatePermissionData = {
      id: permissionId,
      is_active: isActive
    };
    
    return this.updatePermission(updateData);
  }

  // Méthodes utilitaires pour gestion des permissions par utilisateur
  static async getUserPermissions(userId: number): Promise<any> {
    return this.getPermissionsByCriteria({
      data: { user_id: userId }
    });
  }

  static async getProjectPermissions(projectId: number): Promise<any> {
    return this.getPermissionsByCriteria({
      data: { project_id: projectId }
    });
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