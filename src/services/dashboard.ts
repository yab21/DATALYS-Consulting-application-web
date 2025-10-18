"use client";

import { API_CONFIG } from '@/lib/api-config';
import { securedFetch } from '@/lib/api-interceptor';
import { extractBackendMessage } from '@/lib/error-handler';

// Types pour les réponses des APIs dashboard
export interface DashboardPartnerResponse {
  success: boolean;
  data: {
    partner_info: {
      id: number;
      name: string;
      email: string;
      company: string;
      status: string;
    };
    statistics: {
      total_projects: number;
      active_projects: number;
      completed_projects: number;
      total_incidents: number;
      open_incidents: number;
      resolved_incidents: number;
    };
    recent_activities: Array<{
      id: number;
      type: string;
      description: string;
      date: string;
    }>;
  };
  message?: string;
}

export interface DashboardAdminResponse {
  success: boolean;
  data: {
    global_statistics: {
      total_partners: number;
      active_partners: number;
      total_projects: number;
      active_projects: number;
      total_incidents: number;
      open_incidents: number;
    };
    recent_activities: Array<{
      id: number;
      type: string;
      description: string;
      date: string;
      partner_name?: string;
    }>;
    performance_metrics: {
      partner_satisfaction: number;
      average_resolution_time: number;
      project_success_rate: number;
    };
  };
  message?: string;
}

export interface ProjectFilters {
  is_active?: boolean;
  name?: string;
  status?: string;
}

export interface IncidentFilters {
  status?: string;
  priority?: string;
  type?: string;
}

export interface PaginationParams {
  index: number;
  size: number;
  data?: ProjectFilters | IncidentFilters;
}

export interface ProjectResponse {
  success: boolean;
  data: {
    projects: Array<{
      id: number;
      name: string;
      description: string;
      status: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      partner_id: number;
    }>;
    pagination: {
      total: number;
      current_page: number;
      per_page: number;
      total_pages: number;
    };
  };
  message?: string;
}

export interface IncidentResponse {
  success: boolean;
  data: {
    incidents: Array<{
      id: number;
      title: string;
      description: string;
      status: string;
      priority: string;
      type: string;
      created_at: string;
      updated_at: string;
      partner_id: number;
    }>;
    pagination: {
      total: number;
      current_page: number;
      per_page: number;
      total_pages: number;
    };
  };
  message?: string;
}

class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Récupérer le dashboard d'un partenaire
   */
  async getDashboardPartner(partnerId: number): Promise<DashboardPartnerResponse> {
    try {
      const response = await securedFetch(
        `${API_CONFIG.BASE_URL}/dashboard/partner/${partnerId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du dashboard partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les projets d'un partenaire avec filtres et pagination
   */
  async getPartnerProjects(
    partnerId: number,
    params: PaginationParams
  ): Promise<ProjectResponse> {
    try {
      const response = await securedFetch(
        `${API_CONFIG.BASE_URL}/dashboard/partner/${partnerId}/projects`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des projets partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les incidents d'un partenaire avec filtres et pagination
   */
  async getPartnerIncidents(
    partnerId: number,
    params: PaginationParams
  ): Promise<IncidentResponse> {
    try {
      const response = await securedFetch(
        `${API_CONFIG.BASE_URL}/dashboard/partner/${partnerId}/incidents`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération des incidents partenaire:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer le dashboard admin overview
   */
  async getDashboardAdmin(): Promise<DashboardAdminResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}/dashboard/admin/overview`;
      console.log("🔗 Appel API admin dashboard:", url);
      
      const response = await securedFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log("📡 Réponse HTTP:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur API admin:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Gestion spécifique des erreurs 404
        if (response.status === 404) {
          throw new Error(`Endpoint non trouvé: /dashboard/admin/overview n'existe pas sur le backend`);
        }
        
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      // Vérifier que la réponse est bien du JSON avant de parser
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error("❌ Réponse non-JSON reçue:", textResponse.substring(0, 200));
        throw new Error(`Réponse invalide: attendu JSON, reçu ${contentType}`);
      }

      const data = await response.json();
      console.log("✅ Données API admin reçues:", data);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du dashboard admin:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Méthode utilitaire pour créer les paramètres de pagination
   */
  createPaginationParams(
    index: number = 0,
    size: number = 20,
    filters?: ProjectFilters | IncidentFilters
  ): PaginationParams {
    const params: PaginationParams = { index, size };
    
    if (filters && Object.keys(filters).length > 0) {
      // Filtrer les valeurs undefined/null
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      if (Object.keys(cleanFilters).length > 0) {
        params.data = cleanFilters;
      }
    }

    return params;
  }

  /**
   * Méthodes de convenance pour les filtres
   */
  createProjectFilters(options: {
    isActive?: boolean;
    name?: string;
    status?: string;
  }): ProjectFilters {
    const filters: ProjectFilters = {};
    
    if (options.isActive !== undefined) {
      filters.is_active = options.isActive;
    }
    if (options.name) {
      filters.name = options.name;
    }
    if (options.status) {
      filters.status = options.status;
    }

    return filters;
  }

  createIncidentFilters(options: {
    status?: string;
    priority?: string;
    type?: string;
  }): IncidentFilters {
    const filters: IncidentFilters = {};
    
    if (options.status) {
      filters.status = options.status;
    }
    if (options.priority) {
      filters.priority = options.priority;
    }
    if (options.type) {
      filters.type = options.type;
    }

    return filters;
  }
}

// Instance singleton
export const dashboardService = DashboardService.getInstance();

// Fonctions utilitaires d'export
export const getDashboardPartner = (partnerId: number) => 
  dashboardService.getDashboardPartner(partnerId);

export const getPartnerProjects = (partnerId: number, params: PaginationParams) => 
  dashboardService.getPartnerProjects(partnerId, params);

export const getPartnerIncidents = (partnerId: number, params: PaginationParams) => 
  dashboardService.getPartnerIncidents(partnerId, params);

export const getDashboardAdmin = () => 
  dashboardService.getDashboardAdmin();

export const createPaginationParams = (
  index?: number,
  size?: number,
  filters?: ProjectFilters | IncidentFilters
) => dashboardService.createPaginationParams(index, size, filters);

export default dashboardService;