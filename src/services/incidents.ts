import { API_CONFIG, buildApiUrl, getDefaultHeaders } from '@/lib/api-config';
import { extractBackendMessage } from '@/lib/error-handler';
import { securedFetch, isTokenExpiredError } from '@/lib/api-interceptor';
import { UsersService } from '@/services/users';
import { SecureStorage } from '@/lib/secure-storage';

export interface Incident {
  id: number;
  title: string;
  description: string;
  incident_number: string;
  type: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
  priority_label: string;
  status: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';
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
  status: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';
  category: string;
  impact: string;
  domain: string;
  declarant_name: string;
  user_id?: number;
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
  status?: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';
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
  motif_attente?: string;
}

export interface IncidentHistoryEntry {
  id: number;
  incident_id: number;
  old_status: string | null;
  new_status: string;
  action_type: 'status_change' | 'waiting' | 'resolution' | string;
  comment: string | null;
  user_name: string;
  created_at: string;
}

export interface IncidentHistoryResponse {
  code: number;
  incident_number: string;
  current_status: string;
  count: number;
  history: IncidentHistoryEntry[];
}

export interface IncidentAttachment {
  id: number;
  note_id: number;
  incident_id: number;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  author_name: string;
  created_at: string;
  created_by: number;
}

export interface IncidentNote {
  id: number;
  incident_id: number;
  content: string;
  author_name: string;
  created_at: string;
  created_by: number;
  updated_at: string;
  updated_by: number;
  attachments: IncidentAttachment[];
}

export interface IncidentCriteria {
  index?: number;
  size?: number;
  data?: {
    title?: string;
    type?: string;
    priority?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
    status?: 'nouveau' | 'en_cours' | 'en_attente' | 'en_arbitrage' | 'en_pause' | 'resolu';
    category?: string;
    impact?: string;
    domain?: string;
    user_id?: number;
    project_id?: number;
    created_by?: number;
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
  private static async makeRequest(
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

      let data: any;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return {};
      }

      if (data && data.status === "error" && data.message) {
        throw new Error(data.message);
      }

      if (!response.ok) {
        if (data && data.message) {
          throw new Error(data.message);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
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
  static async createIncident(incidentData: CreateIncidentData, userId?: number, userEmail?: string): Promise<any> {
    // Si userId et userEmail sont fournis, les utiliser directement
    let currentUser;
    if (userId && userEmail) {
      currentUser = { id: userId, email: userEmail };
    } else {
      // Sinon, récupérer depuis UsersService (fallback)
      currentUser = UsersService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
    }
    
    // Préparer les données - assigned_to doit être explicitement fourni par l'appelant
    const processedData = {
      ...incidentData,
      assigned_to: incidentData.assigned_to
    };
    
    const requestBody = {
      user: {
        id: currentUser.id,
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
  static async updateIncident(incidentData: UpdateIncidentData, userId?: number, userEmail?: string): Promise<any> {
    // Si userId et userEmail sont fournis, les utiliser directement
    let currentUser;
    if (userId && userEmail) {
      currentUser = { id: userId, email: userEmail };
    } else {
      // Sinon, récupérer depuis UsersService (fallback)
      currentUser = UsersService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
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
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Exporter les incidents selon les critères spécifiés
  static async exportIncidents(options: ExportIncidentOptions, userId?: number, userEmail?: string): Promise<any> {
    // Si userId et userEmail sont fournis, les utiliser directement
    let currentUser;
    if (userId && userEmail) {
      currentUser = { id: userId, email: userEmail };
    } else {
      // Sinon, récupérer depuis UsersService (fallback)
      currentUser = UsersService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
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
  static async exportIncidentsFile(options: ExportIncidentOptions, userId?: number, userEmail?: string): Promise<Blob> {
    // Si userId et userEmail sont fournis, les utiliser directement
    let currentUser;
    if (userId && userEmail) {
      currentUser = { id: userId, email: userEmail };
    } else {
      // Sinon, récupérer depuis UsersService (fallback)
      currentUser = UsersService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }
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
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Récupérer l'historique d'un incident
  static async getIncidentHistory(incidentId: number): Promise<IncidentHistoryResponse> {
    return this.makeRequest(
      `/incidents/${incidentId}/history`,
      'GET'
    );
  }

  // Récupérer les notes de résolution d'un incident
  static async getNotes(incidentId: number): Promise<IncidentNote[]> {
    try {
      const response = await this.makeRequest(`/incidents/${incidentId}/notes`, 'GET');
      if (response?.items && Array.isArray(response.items)) return response.items;
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des notes:', error);
      throw error;
    }
  }

  // Ajouter une note de résolution (avec pièces jointes optionnelles)
  static async addNote(incidentId: number, content: string, userId: number, files: File[] = []): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('user', String(userId));
      files.forEach(file => formData.append('files[]', file));

      const headers: Record<string, string> = {};
      if (typeof window !== 'undefined') {
        const token = SecureStorage.getItem('authToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(buildApiUrl(`/incidents/${incidentId}/notes`), {
        method: 'POST',
        headers,
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data?.status === 'error' && data?.message) throw new Error(data.message);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return data;
      } else {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return {};
      }
    } catch (error) {
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Supprimer une note de résolution (soft delete)
  static async deleteNote(incidentId: number, noteId: number, userId: number, userEmail: string): Promise<any> {
    return this.makeRequest(`/incidents/${incidentId}/notes/${noteId}`, 'DELETE', {
      user: { id: userId, email: userEmail },
    });
  }

  // Récupérer un incident par ID
  static async getIncidentById(incidentId: number): Promise<Incident | null> {
    try {
      const criteria: IncidentCriteria = {
        index: 0,
        size: 1000, // Grande taille pour être sûr de récupérer l'incident
        data: { is_active: true }
      };

      const response = await this.getIncidentsByCriteria(criteria);
      
      // Gérer les différents formats de réponse possibles
      let incidents: Incident[] = [];
      if (response.code === 200 && response.items && Array.isArray(response.items)) {
        incidents = response.items;
      } else if (response.status === 'success' && response.data) {
        incidents = response.data;
      } else if (Array.isArray(response)) {
        incidents = response;
      } else if (response.data && Array.isArray(response.data)) {
        incidents = response.data;
      } else {
        incidents = response;
      }
      
      const incident = incidents.find((i: Incident) => i.id === incidentId);
      return incident || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'incident par ID:', error);
      if (isTokenExpiredError(error)) throw error;
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }
}

// Instance exportée du service
export const incidentsService = new IncidentsService();