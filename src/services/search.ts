import { API_CONFIG, buildApiUrl, getDefaultHeaders, ApiResponse } from '@/lib/api-config';
import { extractBackendMessage } from '@/lib/error-handler';
import { SecureStorage } from '@/lib/secure-storage';

export interface SearchFilters {
  query?: string;
  entityType?: 'all' | 'projects' | 'files' | 'folders' | 'partners' | 'users' | 'incidents';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  priority?: string;
  project_id?: number;
  partner_id?: number;
  user_id?: number;
  is_active?: boolean;
}

export interface SearchResult {
  id: number;
  title: string;
  description?: string;
  type: 'project' | 'file' | 'folder' | 'partner' | 'user' | 'incident';
  status?: string;
  priority?: string;
  created_at: string;
  updated_at: string;
  project_id?: number;
  partner_id?: number;
  user_id?: number;
  metadata?: Record<string, any>;
  // Données spécifiques selon le type
  file_path?: string;
  file_size?: number;
  file_type?: string;
  partner_name?: string;
  user_name?: string;
  project_name?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  by_type: Record<string, number>;
  facets: {
    types: Array<{ type: string; count: number }>;
    statuses: Array<{ status: string; count: number }>;
    priorities: Array<{ priority: string; count: number }>;
    dates: Array<{ date: string; count: number }>;
  };
}

export interface SearchOptions {
  index?: number;
  size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

class SearchService {
  private baseUrl = API_CONFIG.BASE_URL;

  // Vérifier si l'utilisateur peut accéder à un type d'entité
  private canAccessEntity(entityType: string): boolean {
    try {
      const storedUser = SecureStorage.getItem('userInfo');
      if (!storedUser) return false;
      
      const user = JSON.parse(storedUser);
      const roleId = parseInt(user.role_id);
      
      // Administrateurs peuvent accéder à tout
      if (roleId === 1) return true;
      
      // Partenaires (role_id = 5) ne peuvent pas accéder aux utilisateurs et partenaires
      if (roleId === 5) {
        return !['users', 'partners'].includes(entityType);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return false;
    }
  }

  // Utilise les APIs existantes pour la recherche unifiée
  async globalSearch(
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    try {
      const { index = 0, size = 20, sort_by = 'updated_at', sort_order = 'desc' } = options;
      const results: SearchResult[] = [];
      const byType: Record<string, number> = {};

      // Si entityType est spécifié, rechercher seulement dans ce type
      if (filters.entityType && filters.entityType !== 'all') {
        if (this.canAccessEntity(filters.entityType)) {
          const entityResults = await this.searchByEntity(filters.entityType, filters, options);
          if (entityResults.items) {
            const formatted = this.formatSearchResults(entityResults.items, filters.entityType);
            results.push(...formatted);
            byType[filters.entityType] = entityResults.count || 0;
          }
        }
      } else {
        // Recherche dans tous les types d'entités (filtrer selon les permissions)
        const entityTypes = ['projects', 'files', 'folders', 'partners', 'users', 'incidents'] as const;
        
        for (const entityType of entityTypes) {
          // Vérifier les permissions avant d'essayer d'accéder à l'entité
          if (!this.canAccessEntity(entityType)) {
            console.log(`Accès refusé pour l'entité: ${entityType}`);
            byType[entityType] = 0;
            continue;
          }

          try {
            const entityResults = await this.searchByEntity(entityType, filters, { 
              ...options, 
              size: Math.ceil(size / entityTypes.length) 
            });
            if (entityResults.items) {
              const formatted = this.formatSearchResults(entityResults.items, entityType);
              results.push(...formatted);
              byType[entityType] = entityResults.count || 0;
            }
          } catch (error) {
            console.warn(`Erreur lors de la recherche ${entityType}:`, error);
            byType[entityType] = 0;
          }
        }
      }

      // Trier tous les résultats
      results.sort((a, b) => {
        const aValue = a[sort_by as keyof SearchResult] as string;
        const bValue = b[sort_by as keyof SearchResult] as string;
        if (sort_order === 'asc') {
          return aValue > bValue ? 1 : -1;
        }
        return aValue < bValue ? 1 : -1;
      });

      // Limiter le nombre de résultats
      const paginatedResults = results.slice(index * size, (index + 1) * size);

      return {
        results: paginatedResults,
        total: results.length,
        by_type: byType,
        facets: this.generateFacets(results)
      };
    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  async searchByEntity(
    entityType: Exclude<SearchFilters['entityType'], 'all'>,
    filters: SearchFilters,
    options: SearchOptions = {}
  ): Promise<{ items: any[]; count: number }> {
    try {
      const { index = 0, size = 20 } = options;

      let endpoint = '';
      switch (entityType) {
        case 'projects':
          endpoint = '/projects/getByCriteria';
          break;
        case 'files':
          endpoint = '/files/getByCriteria';
          break;
        case 'folders':
          endpoint = '/folders/getByCriteria';
          break;
        case 'partners':
          endpoint = '/partners/getByCriteria';
          break;
        case 'users':
          endpoint = '/users/getByCriteria';
          break;
        case 'incidents':
          endpoint = '/incidents/getByCriteria';
          break;
        default:
          throw new Error(`Type d'entité non supporté: ${entityType}`);
      }

      // Construire les critères de recherche
      const searchCriteria: any = {};
      
      // Ajouter la recherche textuelle si une query est fournie
      if (filters.query) {
        // Pour chaque type d'entité, adapter les champs de recherche
        switch (entityType) {
          case 'projects':
          case 'partners':
          case 'users':
            searchCriteria.name = filters.query;
            break;
          case 'files':
          case 'folders':
            searchCriteria.name = filters.query;
            break;
          case 'incidents':
            searchCriteria.title = filters.query;
            break;
        }
      }

      // Ajouter les autres filtres
      if (filters.status) searchCriteria.status = filters.status;
      if (filters.priority) searchCriteria.priority = filters.priority;
      if (filters.project_id) searchCriteria.project_id = filters.project_id;
      if (filters.partner_id) searchCriteria.partner_id = filters.partner_id;
      if (filters.user_id) searchCriteria.user_id = filters.user_id;
      if (filters.is_active !== undefined) searchCriteria.is_active = filters.is_active;

      // Filtres de date
      if (filters.dateFrom) searchCriteria.created_from = filters.dateFrom;
      if (filters.dateTo) searchCriteria.created_to = filters.dateTo;

      const payload = {
        index,
        size,
        data: searchCriteria
      };

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'POST',
        headers: getDefaultHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return {
        items: data.items || [],
        count: data.count || 0
      };
    } catch (error) {
      console.error(`Erreur lors de la recherche ${entityType}:`, error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Fonction utilitaire pour formater les résultats de recherche
  formatSearchResults(results: any[], type: string): SearchResult[] {
    return results.map(item => {
      const baseResult: SearchResult = {
        id: item.id,
        title: item.name || item.title || `${type} #${item.id}`,
        description: item.description || '',
        type: type as SearchResult['type'],
        status: item.status,
        priority: item.priority,
        created_at: item.created_at,
        updated_at: item.updated_at,
        project_id: item.project_id,
        partner_id: item.partner_id,
        user_id: item.user_id,
        metadata: item
      };

      // Ajouter des propriétés spécifiques selon le type
      switch (type) {
        case 'files':
          baseResult.file_path = item.file_path;
          baseResult.file_size = item.file_size;
          baseResult.file_type = item.file_type;
          break;
        case 'partners':
          baseResult.partner_name = item.name;
          break;
        case 'users':
          baseResult.user_name = item.name;
          break;
        case 'projects':
          baseResult.project_name = item.name;
          break;
      }

      return baseResult;
    });
  }

  // Générer les facettes pour les filtres
  private generateFacets(results: SearchResult[]) {
    const types: Record<string, number> = {};
    const statuses: Record<string, number> = {};
    const priorities: Record<string, number> = {};
    const dates: Record<string, number> = {};

    results.forEach(result => {
      // Compter par type
      types[result.type] = (types[result.type] || 0) + 1;
      
      // Compter par statut
      if (result.status) {
        statuses[result.status] = (statuses[result.status] || 0) + 1;
      }
      
      // Compter par priorité
      if (result.priority) {
        priorities[result.priority] = (priorities[result.priority] || 0) + 1;
      }
      
      // Compter par date (par mois)
      if (result.created_at) {
        const date = new Date(result.created_at).toISOString().substring(0, 7); // YYYY-MM
        dates[date] = (dates[date] || 0) + 1;
      }
    });

    return {
      types: Object.entries(types).map(([type, count]) => ({ type, count })),
      statuses: Object.entries(statuses).map(([status, count]) => ({ status, count })),
      priorities: Object.entries(priorities).map(([priority, count]) => ({ priority, count })),
      dates: Object.entries(dates).map(([date, count]) => ({ date, count }))
    };
  }

  // Sauvegarder une recherche (localStorage pour l'instant)
  async saveSearch(name: string, filters: SearchFilters): Promise<void> {
    try {
      const savedSearches = this.getSavedSearchesFromStorage();
      const newSearch = {
        id: Date.now(),
        name,
        filters,
        created_at: new Date().toISOString()
      };
      
      savedSearches.push(newSearch);
      localStorage.setItem('datalys-saved-searches', JSON.stringify(savedSearches));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recherche:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Récupérer les recherches sauvegardées
  async getSavedSearches(): Promise<Array<{ id: number; name: string; filters: SearchFilters; created_at: string }>> {
    try {
      return this.getSavedSearchesFromStorage();
    } catch (error) {
      console.error('Erreur lors de la récupération des recherches sauvegardées:', error);
      return [];
    }
  }

  // Supprimer une recherche sauvegardée
  async deleteSavedSearch(id: number): Promise<void> {
    try {
      const savedSearches = this.getSavedSearchesFromStorage();
      const filteredSearches = savedSearches.filter(search => search.id !== id);
      localStorage.setItem('datalys-saved-searches', JSON.stringify(filteredSearches));
    } catch (error) {
      console.error('Erreur lors de la suppression de la recherche sauvegardée:', error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  // Helper pour récupérer les recherches depuis localStorage
  private getSavedSearchesFromStorage(): Array<{ id: number; name: string; filters: SearchFilters; created_at: string }> {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem('datalys-saved-searches');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Erreur lors de la lecture des recherches sauvegardées:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();