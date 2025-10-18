/**
 * Service de gestion des partenaires de projet
 * Basé sur les APIs documentées dans le guide d'intégration
 */

import { SecureStorage } from '@/lib/secure-storage';

// Interfaces TypeScript
export interface ProjectPartner {
  id: number;
  user_id: number;
  project_id: number;
  permission_type: 'read' | 'write' | 'admin';
  assigned_at: string;
  assigned_by: number;
  is_active: boolean;
  // Informations du partenaire
  partner_name: string;
  partner_email: string;
  partner_logo?: string;
  partner_phone?: string;
  partner_sector?: string;
  partner_responsible?: string;
  partner_description?: string;
  // Informations de l'utilisateur
  user_name: string;
  user_email: string;
  role_in_project: string;
}

export interface AvailablePartner {
  id: number;
  name: string;
  email: string;
  logo?: string;
  phone?: string;
  sector: string;
  responsible: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface AddPartnerToProjectRequest {
  user: { id: number };
  datas: Array<{
    user_id: number;
    project_id: number;
    permission_type: 'read' | 'write' | 'admin';
  }>;
}

export interface RemovePartnerFromProjectRequest {
  user: { id: number };
  datas: Array<{
    id: number;
  }>;
}

export interface ProjectPartnerListRequest {
  user: { id: number };
  index: number;
  size: number;
  data: {
    project_id: number;
    is_active?: boolean;
  };
}

export interface PartnerListRequest {
  user: { id: number };
  index: number;
  size: number;
  data: {
    is_active?: boolean;
    name?: string;
    sector?: string;
  };
}

export interface ProjectPartnerResponse {
  status: string;
  message: string;
  data?: ProjectPartner[];
  items?: ProjectPartner[];
  count?: number;
}

export interface PartnerResponse {
  status: string;
  message: string;
  data?: AvailablePartner[];
  items?: AvailablePartner[];
  count?: number;
}

class ProjectPartnersService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/proxy';
  }

  private getAuthHeaders(): HeadersInit {
    const token = SecureStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Si on ne peut pas parser la réponse, on garde le message HTTP
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(data.message || 'Erreur lors de la requête');
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`Erreur dans makeRequest (${endpoint}):`, errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupérer les partenaires assignés à un projet
   */
  async getProjectPartners(projectId: number, userId: number): Promise<ProjectPartner[]> {
    const requestData: ProjectPartnerListRequest = {
      user: { id: userId },
      index: 0,
      size: 100,
      data: {
        project_id: projectId,
        is_active: true
      }
    };

    const response = await this.makeRequest<ProjectPartnerResponse>('/user_project_permissions/getByCriteria', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return response.items || response.data || [];
  }

  /**
   * Récupérer tous les partenaires disponibles (non encore assignés au projet)
   */
  async getAvailablePartners(
    userId: number, 
    excludeProjectId?: number,
    searchTerm?: string
  ): Promise<AvailablePartner[]> {
    const requestData: PartnerListRequest = {
      user: { id: userId },
      index: 0,
      size: 100,
      data: {
        is_active: true,
        ...(searchTerm && { name: searchTerm })
      }
    };

    const response = await this.makeRequest<PartnerResponse>('/partners/getByCriteria', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    let partners = response.items || response.data || [];

    // Si un projet est spécifié, exclure les partenaires déjà assignés
    if (excludeProjectId) {
      try {
        const assignedPartners = await this.getProjectPartners(excludeProjectId, userId);
        const assignedPartnerIds = assignedPartners.map(p => p.user_id);
        partners = partners.filter(p => !assignedPartnerIds.includes(p.id));
      } catch (error) {
        console.warn('Impossible de filtrer les partenaires assignés:', error);
      }
    }

    return partners;
  }

  /**
   * Ajouter un partenaire à un projet
   */
  async addPartnerToProject(
    partnerId: number,
    projectId: number,
    permissionType: 'read' | 'write' | 'admin',
    userId: number
  ): Promise<ProjectPartner> {
    const requestData: AddPartnerToProjectRequest = {
      user: { id: userId },
      datas: [{
        user_id: partnerId,
        project_id: projectId,
        permission_type: permissionType
      }]
    };

    const response = await this.makeRequest<ProjectPartnerResponse>('/user_project_permissions/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Aucune donnée retournée lors de l\'ajout du partenaire');
    }

    return response.data[0];
  }

  /**
   * Supprimer un partenaire d'un projet
   */
  async removePartnerFromProject(
    permissionId: number,
    userId: number
  ): Promise<boolean> {
    const requestData: RemovePartnerFromProjectRequest = {
      user: { id: userId },
      datas: [{
        id: permissionId
      }]
    };

    await this.makeRequest('/user_project_permissions/delete', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return true;
  }

  /**
   * Modifier les permissions d'un partenaire sur un projet
   */
  async updatePartnerPermissions(
    permissionId: number,
    newPermissionType: 'read' | 'write' | 'admin',
    userId: number
  ): Promise<ProjectPartner> {
    const requestData = {
      user: { id: userId },
      datas: [{
        id: permissionId,
        permission_type: newPermissionType
      }]
    };

    const response = await this.makeRequest<ProjectPartnerResponse>('/user_project_permissions/update', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('Aucune donnée retournée lors de la mise à jour');
    }

    return response.data[0];
  }

  /**
   * Rechercher des partenaires par nom ou secteur
   */
  async searchPartners(
    searchTerm: string,
    userId: number,
    excludeProjectId?: number
  ): Promise<AvailablePartner[]> {
    return this.getAvailablePartners(userId, excludeProjectId, searchTerm);
  }

  /**
   * Obtenir les détails d'un partenaire spécifique
   */
  async getPartnerDetails(partnerId: number, userId: number): Promise<AvailablePartner | null> {
    const requestData: PartnerListRequest = {
      user: { id: userId },
      index: 0,
      size: 1,
      data: {
        is_active: true
      }
    };

    try {
      const response = await this.makeRequest<PartnerResponse>('/partners/getByCriteria', {
        method: 'POST',
        body: JSON.stringify(requestData)
      });

      const partners = response.items || response.data || [];
      return partners.find(p => p.id === partnerId) || null;
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du partenaire:', error);
      return null;
    }
  }

  /**
   * Obtenir les statistiques des partenaires d'un projet
   */
  async getProjectPartnerStats(projectId: number, userId: number): Promise<{
    totalPartners: number;
    partnersByPermission: Record<string, number>;
    recentlyAdded: ProjectPartner[];
  }> {
    try {
      const partners = await this.getProjectPartners(projectId, userId);
      
      const stats = {
        totalPartners: partners.length,
        partnersByPermission: {} as Record<string, number>,
        recentlyAdded: partners
          .sort((a, b) => new Date(b.assigned_at).getTime() - new Date(a.assigned_at).getTime())
          .slice(0, 3)
      };

      // Compter par type de permission
      partners.forEach(partner => {
        const permission = partner.permission_type;
        stats.partnersByPermission[permission] = (stats.partnersByPermission[permission] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalPartners: 0,
        partnersByPermission: {},
        recentlyAdded: []
      };
    }
  }

  /**
   * Vérifier si un partenaire est déjà assigné à un projet
   */
  async isPartnerAssignedToProject(
    partnerId: number,
    projectId: number,
    userId: number
  ): Promise<boolean> {
    try {
      const partners = await this.getProjectPartners(projectId, userId);
      return partners.some(p => p.user_id === partnerId);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'assignation:', error);
      return false;
    }
  }

  /**
   * Obtenir le label d'une permission
   */
  getPermissionLabel(permission: string): string {
    switch (permission) {
      case 'read': return 'Lecture';
      case 'write': return 'Écriture';
      case 'admin': return 'Administrateur';
      default: return permission;
    }
  }

  /**
   * Obtenir la couleur d'une permission pour l'affichage
   */
  getPermissionColor(permission: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    switch (permission) {
      case 'read': return 'default';
      case 'write': return 'primary';
      case 'admin': return 'success';
      default: return 'default';
    }
  }
}

export const projectPartnersService = new ProjectPartnersService();