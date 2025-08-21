// Service de gestion des projets pour DATALYS Consulting

import {
  buildApiUrl,
  getDefaultHeaders,
} from "@/lib/api-config";

export interface Project {
  id: number;
  title: string;
  partner_name?: string; // Nouveau: nom du partenaire
  partner_id?: number; // Gardé pour compatibilité réponse API
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateProjectFormData {
  title: string;
  partner_name: string; // Nouveau: utilise partner_name
  is_active?: boolean;
}

// Nouvelles interfaces pour les requêtes API
export interface ProjectCreateRequest {
  user: {
    id: number;
  };
  datas: Array<{
    title: string;
    partner_name: string;
  }>;
}

export interface ProjectUpdateRequest {
  user: {
    id: number;
  };
  datas: Array<{
    id: number;
    title: string;
    partner_name?: string;
    is_active: boolean;
  }>;
}

export interface ProjectDeleteRequest {
  user: {
    id: number;
  };
  datas: Array<{
    id: number;
    title: string;
  }>;
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
    partner_name?: string; // Nouveau: filtrage par nom de partenaire
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
        // Transformer les données pour extraire le nom du partenaire
        const transformedProjects = result.items.map((project: any) => ({
          ...project,
          partner_name: project.partner?.name || null
        }));
        
        console.log("📝 Projets transformés avec partner_name:", transformedProjects.slice(0, 2));
        return transformedProjects;
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la récupération des projets');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des projets:", error);
      throw error;
    }
  }

  /**
   * Récupérer les projets d'un partenaire spécifique (pour les utilisateurs partenaires)
   */
  async getPartnerProjects(partnerId: number): Promise<Project[]> {
    try {
      console.log(`📡 Appel API getPartnerProjects pour partenaire ${partnerId}...`);
      
      const response = await fetch(
        buildApiUrl(`/dashboard/partner/${partnerId}/projects`),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            index: 0,
            size: 100
          }),
        }
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Réponse dashboard partner projects:", result);

      if (result.success && result.data?.projects) {
        // Transformer les données du dashboard vers le format Project
        const transformedProjects: Project[] = result.data.projects.map((project: any) => ({
          id: project.id,
          title: project.name || project.title,
          partner_name: project.partner_name || null,
          partner_id: partnerId,
          is_active: project.is_active !== false, // Par défaut true si non spécifié
          is_deleted: project.is_deleted || false,
          created_at: project.created_at || new Date().toISOString(),
          updated_at: project.updated_at || new Date().toISOString(),
          created_by: project.created_by || 0,
          updated_by: project.updated_by || 0,
        }));
        
        console.log("📝 Projets du partenaire transformés:", transformedProjects);
        return transformedProjects;
      } else {
        console.log("📄 Aucun projet trouvé pour le partenaire");
        return [];
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des projets du partenaire:", error);
      throw error;
    }
  }

  /**
   * Récupérer les projets par partenaire (par nom)
   */
  async getProjectsByPartner(partnerName: string): Promise<Project[]> {
    try {
      console.log(`📡 Appel API getProjectsByPartner pour partenaire ${partnerName}...`);
      
      const requestBody: ProjectByCriteriaRequest = {
        index: 0,
        size: 100,
        data: {
          is_active: true,
          partner_name: partnerName
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
        // Transformer les données pour extraire le nom du partenaire
        const transformedProjects = result.items.map((project: any) => ({
          ...project,
          partner_name: project.partner?.name || null
        }));
        
        return transformedProjects;
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
  async createProject(projectData: CreateProjectFormData, userId: number): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log("📡 Création d'un nouveau projet...");
      
      const requestBody: ProjectCreateRequest = {
        user: {
          id: userId
        },
        datas: [{
          title: projectData.title,
          partner_name: projectData.partner_name
        }]
      };

      console.log("📋 Données du projet à créer:", requestBody);

      const response = await fetch(
        buildApiUrl('/projects/create'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(requestBody),
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
  async updateProject(projectId: number, title: string, isActive: boolean, userId: number, partnerName?: string): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Mise à jour du projet ${projectId}...`);
      
      const requestBody: ProjectUpdateRequest = {
        user: {
          id: userId
        },
        datas: [{
          id: projectId,
          title: title,
          is_active: isActive,
          ...(partnerName && { partner_name: partnerName })
        }]
      };

      console.log("📋 Données de mise à jour:", requestBody);

      const response = await fetch(
        buildApiUrl('/projects/update'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(requestBody),
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
  async deleteProject(projectId: number, projectTitle: string, userId: number): Promise<{code: number; message: {code: number; message: string}}> {
    try {
      console.log(`📡 Suppression du projet ${projectId}...`);
      
      const requestBody: ProjectDeleteRequest = {
        user: {
          id: userId
        },
        datas: [{
          id: projectId,
          title: projectTitle
        }]
      };

      console.log("📋 Données de suppression:", requestBody);

      const response = await fetch(
        buildApiUrl('/projects/delete'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(requestBody),
        }
      );

      console.log("📨 Statut de la réponse suppression:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Détails de l'erreur:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Projet supprimé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du projet:", error);
      throw error;
    }
  }

  /**
   * Obtenir la liste des noms de partenaires pour la sélection
   */
  async getPartnerNames(): Promise<string[]> {
    try {
      console.log("📡 Récupération des noms de partenaires...");
      
      // Utiliser le service partners pour récupérer la liste
      const response = await fetch(
        buildApiUrl('/partners/getByCriteria'),
        {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            index: 0,
            size: 100,
            data: {
              is_active: true
            }
          }),
        }
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Partenaires récupérés:", result);

      if (result.code === 200 && result.items) {
        // Extraire les noms des partenaires
        return result.items.map((partner: any) => partner.name || partner.company_name);
      } else {
        throw new Error(result.message?.message || 'Erreur lors de la récupération des partenaires');
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des partenaires:", error);
      throw error;
    }
  }
}

// Instance exportée du service
export const projectsService = new ProjectsService();