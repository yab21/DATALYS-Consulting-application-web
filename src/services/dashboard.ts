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

// Nouvelle structure pour l'API admin dashboard
export interface DashboardAdminResponse {
  code: number;
  data: {
    global_activity_stats: {
      actions_by_type: Array<{
        count: number;
        type: string;
      }>;
      daily_actions: Array<{
        count: number;
        date: string;
      }>;
      top_users: Array<{
        count: number;
        user_id: number;
      }>;
      total_actions: number;
    };
    incident_priority_stats: {
      basse: number;
      critique: number;
      haute: number;
      moyenne: number;
    };
    partner_stats: Array<{
      active_projects: number;
      partner_id: number;
      partner_name: string;
      total_projects: number;
    }>;
    recent_activity: Array<RecentActivity>;
    recent_incidents: Array<RecentIncident>;
  };
  message?: string;
}

// Type pour les éléments d'activité récente
export interface RecentActivity {
  action_type: string;
  created_at: string;
  description: string;
  entity_id: number;
  entity_type: string;
  id: number;
  ip_address: string;
  user_id: number;
  user_name: string;
}

// Interface pour les incidents récents
export interface RecentIncident {
  assigned_to?: number;
  category: string;
  created_at: string;
  created_by: number;
  declarant_name?: string;
  description: string;
  domain?: string;
  id: number;
  impact?: string;
  impact_label?: string;
  incident_number: string;
  is_active: boolean;
  is_deleted: boolean;
  is_read: boolean;
  priority: string;
  priority_label: string;
  project_id?: number;
  refusal_count: number;
  resolution_notes?: string;
  sla_prise_en_charge_deadline?: string;
  sla_prise_en_charge_status: string;
  sla_resolution_deadline?: string;
  sla_resolution_status: string;
  status: string;
  status_color: string;
  temps_restant_prise_en_charge?: any;
  temps_restant_resolution?: any;
  title: string;
  type: string;
  updated_at: string;
  updated_by: number;
  user_id?: number;
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
  async getDashboardPartner(partnerId: number): Promise<any> {
    try {
      const response = await securedFetch(
        `${API_CONFIG.BASE_URL}/dashboard/partner/${partnerId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
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
   * Récupérer le dashboard admin (nouvelle API)
   */
  async getDashboardAdmin(): Promise<DashboardAdminResponse> {
    try {
      const url = `${API_CONFIG.BASE_URL}/dashboard/admin`;
      console.log("🔗 Appel nouvelle API admin dashboard:", url);
      
      const response = await securedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      console.log("📡 Réponse HTTP:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur API admin:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        throw new Error(`Erreur HTTP: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Données nouvelle API admin reçues:", data);
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