import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '@/lib/api-config';
import { extractBackendMessage } from '@/lib/error-handler';
import { securedFetch } from '@/lib/api-interceptor';
import { UsersService } from '@/services/users';

export interface Incident {
  id: number;
  title: string;
  description: string;
  incident_number: string;
  type: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  priority_label: string;
  status: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'resolu';
  status_color: 'blue' | 'orange' | 'gray' | 'purple' | 'green' | 'default';
  category: string;
  impact: string;
  impact_label: string;
  domain: string;
  declarant_name: string;
  user_id: number;
  project_id: number;
  sla_prise_en_charge_status: 'respecte' | 'en_retard' | 'non_applicable';
  sla_resolution_status: 'respecte' | 'en_retard' | 'non_applicable';
  is_active: boolean;
  is_read: boolean;
  refusal_count: number;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  type: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'resolu';
  category: string;
  impact: string;
  domain: string;
  declarant_name: string;
  user_id: number;
  project_id: number;
  assigned_to?: number;
  is_active: boolean;
  is_read?: boolean;
  resolution_notes?: string;
}

export interface UpdateIncidentData {
  id: number;
  title?: string;
  description?: string;
  type?: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  status?: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'resolu';
  category?: string;
  impact?: string;
  domain?: string;
  declarant_name?: string;
  user_id?: number;
  project_id?: number;
  assigned_to?: number;
  is_active?: boolean;
  is_read?: boolean;
  resolution_notes?: string;
}

export interface IncidentCriteria {
  index?: number;
  size?: number;
  data?: {
    title?: string;
    type?: string;
    priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
    status?: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'resolu';
    category?: string;
    impact?: string;
    domain?: string;
    user_id?: number;
    project_id?: number;
    is_active?: boolean;
    is_read?: boolean;
  };
}

export interface ExportIncidentOptions {
  format: 'pdf' | 'xlsx' | 'csv';
  criteria?: {
    status?: string;
    priority?: string;
    category?: string;
    domain?: string;
    user_id?: number;
    project_id?: number;
  };
  date_from: string;
  date_to: string;
  include_stats: boolean;
  include_details?: boolean;
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
      const message = extractBackendMessage(error);
      throw new Error(message);
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
    // Récupérer les informations de l'utilisateur connecté
    const currentUser = UsersService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Préparer les données avec assigned_to basé sur user_id
    const processedData = {
      ...incidentData,
      // Si assigned_to n'est pas spécifié, utiliser user_id comme valeur par défaut
      assigned_to: incidentData.assigned_to || incidentData.user_id
    };
    
    const requestBody = {
      user: {
        id: userId || currentUser.id,
        email: currentUser.email
      },
      datas: [processedData]
    };
    
    return this.makeRequest(
      API_CONFIG.ENDPOINTS.INCIDENTS.CREATE,
      'POST',
      requestBody
    );
  }

  // Mettre à jour un incident
  static async updateIncident(incidentData: UpdateIncidentData, userId?: number): Promise<any> {
    // Récupérer les informations de l'utilisateur connecté
    const currentUser = UsersService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Préparer les données avec assigned_to basé sur user_id si spécifié
    const processedData = {
      ...incidentData
    };
    
    // Si user_id est modifié, synchroniser avec assigned_to
    if (incidentData.user_id !== undefined) {
      processedData.assigned_to = incidentData.user_id;
    }
    
    const requestBody = {
      user: {
        id: userId || currentUser.id,
        email: currentUser.email
      },
      datas: [processedData]
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
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Exporter les incidents selon les critères spécifiés
  static async exportIncidents(options: ExportIncidentOptions, userId?: number): Promise<any> {
    // Récupérer les informations de l'utilisateur connecté
    const currentUser = UsersService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    const requestBody = {
      user: {
        id: userId || currentUser.id,
        email: currentUser.email
      },
      format: options.format,
      criteria: options.criteria || {},
      date_from: options.date_from,
      date_to: options.date_to,
      include_stats: options.include_stats,
      ...(options.include_details && { include_details: options.include_details })
    };
    
    return this.makeRequest(
      '/incidents/export',
      'POST',
      requestBody
    );
  }

  // Méthode spécialisée pour l'export de fichiers (PDF, Excel, CSV)
  static async exportIncidentsFile(options: ExportIncidentOptions): Promise<Blob> {
    const currentUser = UsersService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    
    const requestBody = {
      user: {
        id: currentUser.id,
        email: currentUser.email
      },
      format: options.format,
      criteria: options.criteria || {},
      date_from: options.date_from,
      date_to: options.date_to,
      include_stats: options.include_stats,
      ...(options.include_details && { include_details: options.include_details })
    };
    
    try {
      const response = await securedFetch(`${API_CONFIG.BASE_URL}/incidents/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log(`📡 Export response status: ${response.status}`);

      if (!response.ok) {
        // Essayer de récupérer un message d'erreur JSON si possible
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Export échoué: ${response.status}`);
        } catch {
          throw new Error(`Export échoué: ${response.status} ${response.statusText}`);
        }
      }

      // Vérifier le Content-Type pour s'assurer que c'est bien un fichier
      const contentType = response.headers.get('content-type');
      console.log(`📄 Content-Type: ${contentType}`);

      // Récupérer le blob
      const blob = await response.blob();
      console.log(`📦 Taille du fichier exporté: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Le fichier exporté est vide');
      }

      return blob;
    } catch (error) {
      console.error('❌ Erreur lors de l\'export des incidents:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }
}

// Instance exportée du service
export const incidentsService = new IncidentsService();