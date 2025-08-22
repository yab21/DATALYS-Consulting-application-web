import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '@/lib/api-config';

export interface Incident {
  id: number;
  title: string;
  description: string;
  user_name: string;
  project_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface CreateIncidentData {
  title: string;
  description: string;
  user_name: string;
  project_name: string;
  is_active: boolean;
  priority?: string;
  status?: string;
}

export interface UpdateIncidentData {
  id: number;
  title?: string;
  description?: string;
  user_name?: string;
  project_name?: string;
  is_active?: boolean;
  priority?: string;
  status?: string;
}

export interface IncidentCriteria {
  index?: number;
  size?: number;
  data?: {
    title?: string;
    user_name?: string;
    project_name?: string;
    is_active?: boolean;
    priority?: string;
    status?: string;
  };
}

export class IncidentsService {
  private static async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<any> {
    try {
      console.log(`🌐 Incidents API ${method} ${buildApiUrl(endpoint)}`);
      console.log('📦 Body:', body);
      
      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: getDefaultHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);

      const data = await response.json();
      console.log('📥 Response data:', data);
      
      // Vérifier si la réponse contient une erreur même avec un status HTTP 200
      if (data && data.status === "error" && data.message) {
        console.error('❌ API Error:', data.message);
        throw new Error(data.message);
      }
      
      if (!response.ok) {
        // Si la réponse contient un message d'erreur, l'utiliser
        if (data && data.message) {
          throw new Error(data.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Retourner les données
      return data;
    } catch (error) {
      console.error('❌ Incidents API Error:', error);
      throw error;
    }
  }

  // Récupérer les incidents par critères
  static async getIncidentsByCriteria(criteria: IncidentCriteria = {}): Promise<any> {
    const requestBody = {
      index: criteria.index || 0,
      size: criteria.size || 50,
      data: criteria.data || { is_active: true }
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.INCIDENTS.GET_BY_CRITERIA,
      'POST',
      requestBody
    );
  }

  // Créer un nouvel incident
  static async createIncident(incidentData: CreateIncidentData, userId?: number): Promise<any> {
    // Récupérer l'ID de l'utilisateur connecté
    const currentUserId = userId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: currentUserId
      },
      datas: [incidentData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.INCIDENTS.CREATE,
      'POST',
      requestBody
    );
  }

  // Mettre à jour un incident
  static async updateIncident(incidentData: UpdateIncidentData, userId?: number): Promise<any> {
    const currentUserId = userId || this.getCurrentUserId() || 1;
    
    const requestBody = {
      user: {
        id: currentUserId
      },
      datas: [incidentData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.INCIDENTS.UPDATE,
      'POST',
      requestBody
    );
  }

  // Supprimer un incident
  static async deleteIncident(incidentId: number): Promise<any> {
    const requestBody = {
      datas: [
        { id: incidentId }
      ]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.INCIDENTS.DELETE,
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

  // Méthodes utilitaires pour les statistiques
  static async getIncidentStats(): Promise<any> {
    try {
      const response = await this.getIncidentsByCriteria({
        size: 1000 // Récupérer beaucoup d'incidents pour les stats
      });

      let incidents = [];
      if (response.code === 200 && response.items) {
        incidents = response.items;
      } else if (Array.isArray(response)) {
        incidents = response;
      }

      // Calculer les statistiques
      const stats = {
        total: incidents.length,
        active: incidents.filter((i: Incident) => i.is_active).length,
        inactive: incidents.filter((i: Incident) => !i.is_active).length,
        // Ajouter d'autres statistiques selon les besoins
      };

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }
}

// Instance exportée du service
export const incidentsService = new IncidentsService();