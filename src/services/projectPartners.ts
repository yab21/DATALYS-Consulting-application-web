/**
 * Service de gestion des partenaires de projet
 * Basé sur les APIs documentées dans le guide d'intégration
 */

import { extractBackendMessage } from '@/lib/error-handler';

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
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
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
      console.error(`Erreur dans makeRequest (${endpoint}):`, {
        error,
        errorMessage,
        endpoint,
        url: `${this.baseUrl}${endpoint}`,
        method: options.method
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Récupérer les partenaires assignés à un projet
   * Utilise d'abord l'API user_project_permissions, avec fallback sur le partner_id du projet
   */
  async getProjectPartners(projectId: number, userId: number): Promise<ProjectPartner[]> {
    console.log('🔍 [PROJECT_PARTNERS] - Début getProjectPartners:', { projectId, userId });

    // Méthode 1 : Essayer l'API user_project_permissions/getByCriteria
    // Utilisation d'un fetch direct pour éviter le console.error de makeRequest (endpoint pas toujours disponible)
    try {
      const requestData: ProjectPartnerListRequest = {
        user: { id: userId },
        index: 0,
        size: 100,
        data: {
          project_id: projectId,
          is_active: true
        }
      };

      const response = await fetch(`${this.baseUrl}/user_project_permissions/getByCriteria`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const items = data.data || data.items || [];
          console.log('✅ [PROJECT_PARTNERS] - Permissions projet récupérées:', items.length);

          if (items.length > 0) {
            return items;
          }
        }
      }
    } catch {
      // Silencieux : endpoint optionnel, fallback ci-dessous
    }

    // Méthode 2 (fallback) : Trouver le partner_id du projet et chercher ses utilisateurs
    try {
      const { projectsService } = await import('@/services/projects');
      const { UsersService } = await import('@/services/users');

      // Récupérer le projet pour trouver son partner_id
      const allProjects = await projectsService.getActiveProjects();
      const targetProject = allProjects.find((p) => p.id === projectId);

      if (!targetProject || !targetProject.partner_id) {
        console.log('⚠️ [PROJECT_PARTNERS] - Projet sans partner_id, retour tableau vide');
        return [];
      }

      console.log('🔍 [PROJECT_PARTNERS] - Fallback: partner_id du projet =', targetProject.partner_id);

      // Récupérer les utilisateurs liés à ce partenaire
      const response = await UsersService.getUsersByCriteria({
        index: 0,
        size: 100,
        data: {
          is_active: true
        }
      });

      const users = response.items || response.data || [];

      // Filtrer les utilisateurs partenaires (role_id = 4) qui appartiennent au partner_id du projet
      const partners = users.filter(
        (user: any) => user.role_id === 4 && user.partner_id === targetProject.partner_id
      );

      const result: ProjectPartner[] = partners.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        project_id: projectId,
        permission_type: 'read' as const,
        assigned_at: user.created_at || new Date().toISOString(),
        assigned_by: userId,
        is_active: user.is_active,
        partner_name: user.name,
        partner_email: user.email,
        partner_logo: undefined,
        partner_phone: undefined,
        partner_sector: 'Partenaire',
        partner_responsible: user.name,
        partner_description: 'Membre de l\'équipe projet',
        user_name: user.name,
        user_email: user.email,
        role_in_project: 'Partenaire'
      }));

      console.log('✅ [PROJECT_PARTNERS] - Membres d\'équipe du projet:', result.length);

      return result;
    } catch (error) {
      console.error('❌ [PROJECT_PARTNERS] - Erreur dans getProjectPartners:', {
        projectId,
        userId,
        error
      });

      return [];
    }
  }

  /**
   * Récupérer tous les partenaires disponibles (non encore assignés au projet)
   * CORRECTION: Utiliser l'API users/getByCriteria qui fonctionne réellement
   */
  async getAvailablePartners(
    userId: number, 
    excludeProjectId?: number,
    searchTerm?: string
  ): Promise<AvailablePartner[]> {
    try {
      const { UsersService } = await import('@/services/users');
      
      const response = await UsersService.getUsersByCriteria({
        index: 0,
        size: 100,
        data: {
          is_active: true,
          ...(searchTerm && { name: searchTerm })
        }
      });

      const users = response.items || response.data || [];
      
      // Filtrer seulement les utilisateurs partenaires (role_id = 4)
      let partners = users
        .filter((user: any) => user.role_id === 4)
        .map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          logo: undefined,
          phone: undefined,
          sector: 'Partenaire',
          responsible: user.name,
          description: 'Partenaire du projet',
          is_active: user.is_active,
          created_at: user.created_at || new Date().toISOString()
        }));

      // Si un projet est spécifié, exclure les partenaires déjà assignés
      if (excludeProjectId) {
        try {
          const assignedPartners = await this.getProjectPartners(excludeProjectId, userId);
          const assignedPartnerIds = assignedPartners.map(p => p.user_id);
          partners = partners.filter((p: AvailablePartner) => !assignedPartnerIds.includes(p.id));
        } catch (error) {
          console.warn('Impossible de filtrer les partenaires assignés:', error);
        }
      }

      return partners;
    } catch (error) {
      console.error('Erreur lors de la récupération des partenaires disponibles:', error);
      return [];
    }
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
   * CORRECTION: Utiliser l'API users/getByCriteria qui fonctionne réellement
   */
  async getPartnerDetails(partnerId: number, _userId?: number): Promise<AvailablePartner | null> {
    try {
      const { UsersService } = await import('@/services/users');
      
      const response = await UsersService.getUsersByCriteria({
        index: 0,
        size: 100,
        data: {
          is_active: true
        }
      });

      const users = response.items || response.data || [];
      const user = users.find((u: any) => u.id === partnerId && u.role_id === 4);
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        logo: undefined,
        phone: undefined,
        sector: 'Partenaire',
        responsible: user.name,
        description: 'Partenaire du projet',
        is_active: user.is_active,
        created_at: user.created_at || new Date().toISOString()
      };
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