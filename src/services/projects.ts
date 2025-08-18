// Service de gestion des projets pour DATALYS Consulting

import {
  API_CONFIG,
  buildApiUrl,
  getDefaultHeaders,
} from "@/lib/api-config";

export interface Project {
  id: number;
  title: string;
  partner_id: number;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateProjectFormData {
  title: string;
  partner_id: number;
  is_active?: boolean;
}

export interface ProjectApiResponse<T = Project[]> {
  code: number;
  count: number;
  items: T;
  message: {
    code: number;
    message: string;
  };
}

export interface ProjectByCriteriaRequest {
  index: number;
  size: number;
  data: {
    is_active?: boolean;
    partner_id?: number;
  };
}

export class ProjectsService {
  private token: string | null = null;

  constructor() {
    // Initialiser le token depuis localStorage
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem('authToken');
    }
  }

  /**
   * Définir le token d'authentification
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Obtenir les headers avec authentification
   */
  private getAuthHeaders(): HeadersInit {
    return {
      ...getDefaultHeaders(),
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
    };
  }

  /**
   * Récupérer tous les projets actifs
   */
  async getActiveProjects(): Promise<Project[]> {
    try {
      console.log("📡 Appel API getActiveProjects...");
      
      const requestBody: ProjectByCriteriaRequest = {
        index: 0,
        size: 100,
        data: {
          is_active: true
        }
      };

      const response = await fetch(
        buildApiUrl('/projects/getByCriteria'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(requestBody),
        }
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse = await response.json();
      console.log("✅ Réponse getByCriteria complète:", result);

      if (result.code === 200 && result.items) {
        return result.items;
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la récupération des projets');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des projets:", error);
      throw error;
    }
  }

  /**
   * Récupérer les projets par partenaire
   */
  async getProjectsByPartner(partnerId: number): Promise<Project[]> {
    try {
      console.log(`📡 Appel API getProjectsByPartner pour partenaire ${partnerId}...`);
      
      const requestBody: ProjectByCriteriaRequest = {
        index: 0,
        size: 100,
        data: {
          is_active: true,
          partner_id: partnerId
        }
      };

      const response = await fetch(
        buildApiUrl('/projects/getByCriteria'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(requestBody),
        }
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse = await response.json();
      console.log("✅ Réponse getByCriteria pour partenaire:", result);

      if (result.code === 200 && result.items) {
        return result.items;
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la récupération des projets');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des projets par partenaire:", error);
      throw error;
    }
  }

  /**
   * Créer un nouveau projet
   */
  async createProject(projectData: CreateProjectFormData, userId?: number): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log("📡 Création d'un nouveau projet...");
      
      const finalProjectData = {
        ...projectData,
        is_active: projectData.is_active ?? true,
        created_by: userId
      };

      console.log("📋 Données du projet à créer:", finalProjectData);

      const response = await fetch(
        buildApiUrl('/projects/create'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(finalProjectData),
        }
      );

      console.log("📨 Statut de la réponse création:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Détails de l'erreur:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet créé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la création du projet:", error);
      throw error;
    }
  }

  /**
   * Mettre à jour un projet
   */
  async updateProject(projectId: number, projectData: Partial<CreateProjectFormData>, userId?: number): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Mise à jour du projet ${projectId}...`);
      
      const finalProjectData = {
        ...projectData,
        updated_by: userId
      };

      console.log("📋 Données de mise à jour:", finalProjectData);

      const response = await fetch(
        buildApiUrl(`/projects/${projectId}`),
        {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(finalProjectData),
        }
      );

      console.log("📨 Statut de la réponse mise à jour:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Détails de l'erreur:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet mis à jour avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du projet:", error);
      throw error;
    }
  }

  /**
   * Supprimer un projet (soft delete)
   */
  async deleteProject(projectId: number, userId?: number): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Suppression du projet ${projectId}...`);
      
      const response = await fetch(
        buildApiUrl(`/projects/${projectId}`),
        {
          method: 'DELETE',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({ updated_by: userId }),
        }
      );

      console.log("📨 Statut de la réponse suppression:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Détails de l'erreur:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet supprimé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du projet:", error);
      throw error;
    }
  }

  /**
   * Obtenir un projet par ID
   */
  async getProjectById(projectId: number): Promise<Project | null> {
    try {
      console.log(`📡 Récupération du projet ${projectId}...`);
      
      const response = await fetch(
        buildApiUrl(`/projects/${projectId}`),
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse<Project> = await response.json();
      console.log("✅ Projet récupéré:", result);

      if (result.code === 200 && result.items) {
        return Array.isArray(result.items) ? result.items[0] : result.items;
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la récupération du projet');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du projet:", error);
      throw error;
    }
  }
}

// Instance exportée du service
export const projectsService = new ProjectsService();