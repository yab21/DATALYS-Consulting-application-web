// Service de gestion des projets pour DATALYS Consulting

import { buildApiUrl, getDefaultHeaders } from "@/lib/api-config";
import { SecureStorage } from "@/lib/secure-storage";
import { extractBackendMessage } from "@/lib/error-handler";

export interface Project {
  id: number;
  title: string;
  description?: string;
  partner_name?: string;
  partner_id?: number;
  is_active: boolean;
  is_deleted: boolean;
  closed_at?: string | null;
  closed_by?: number | null;
  closure_reason?: string | null;
  reopened_at?: string | null;
  reopened_by?: number | null;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateProjectFormData {
  title: string;
  partner_id?: number; // Optionnel - un projet peut être créé sans partenaire
  is_active?: boolean;
}

// Nouvelles interfaces pour les requêtes API
export interface ProjectCreateRequest {
  user: {
    id: number;
    email: string;
  };
  datas: Array<{
    title: string;
    partner_id?: number; // Optionnel
  }>;
}

export interface ProjectUpdateRequest {
  user: {
    id: number;
    email: string;
  };
  datas: Array<{
    id: number;
    name?: string;
    title: string;
    description?: string;
    partner_id?: number;
    partner_name?: string;
    is_active?: boolean;
  }>;
}

export interface ProjectDeleteRequest {
  user: {
    id: number;
    email: string;
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
      this.token = SecureStorage.getItem("authToken");
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
    // Toujours récupérer le token le plus récent depuis le storage
    const currentToken = typeof window !== "undefined" ? SecureStorage.getItem("authToken") : this.token;
    return {
      ...getDefaultHeaders(),
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
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
          is_active: true,
        },
      };

      const response = await fetch(buildApiUrl("/projects/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

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
          partner_name: project.partner?.name || null,
        }));

        console.log(
          "📝 Projets transformés avec partner_name:",
          transformedProjects.slice(0, 2),
        );
        return transformedProjects;
      } else {
        throw new Error(
          result.message?.message ||
            "Erreur lors de la récupération des projets",
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des projets:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer tous les projets (actifs + clôturés, sans les supprimés)
   */
  async getAllProjects(): Promise<Project[]> {
    try {
      console.log("📡 Appel API getAllProjects...");

      const requestBody: ProjectByCriteriaRequest = {
        index: 0,
        size: 100,
        data: {},
      };

      const response = await fetch(buildApiUrl("/projects/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProjectApiResponse = await response.json();
      console.log("✅ Réponse getAllProjects complète:", result);

      if (result.code === 200 && result.items) {
        const transformedProjects = result.items.map((project: any) => ({
          ...project,
          partner_name: project.partner?.name || null,
        }));

        return transformedProjects;
      } else {
        throw new Error(
          result.message?.message ||
            "Erreur lors de la récupération des projets",
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors de la récupération de tous les projets:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les projets d'un partenaire spécifique (pour les utilisateurs partenaires)
   */
  async getPartnerProjects(partnerId: number): Promise<Project[]> {
    try {
      console.log(
        `📡 Appel API getPartnerProjects pour partenaire ${partnerId}...`,
      );

      const response = await fetch(
        buildApiUrl(`/dashboard/partner/${partnerId}/projects`),
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            index: 0,
            size: 100,
          }),
        },
      );

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Réponse dashboard partner projects:", result);

      if (result.success && result.data?.projects) {
        // Transformer les données du dashboard vers le format Project
        const transformedProjects: Project[] = result.data.projects.map(
          (project: any) => ({
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
          }),
        );

        console.log(
          "📝 Projets du partenaire transformés:",
          transformedProjects,
        );
        return transformedProjects;
      } else {
        console.log("📄 Aucun projet trouvé pour le partenaire");
        return [];
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des projets du partenaire:",
        error,
      );
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Récupérer les projets par partenaire (par nom)
   */
  async getProjectsByPartner(partnerName: string): Promise<Project[]> {
    try {
      console.log(
        `📡 Appel API getProjectsByPartner pour partenaire ${partnerName}...`,
      );

      const requestBody: ProjectByCriteriaRequest = {
        index: 0,
        size: 100,
        data: {
          is_active: true,
          partner_name: partnerName,
        },
      };

      const response = await fetch(buildApiUrl("/projects/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

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
          partner_name: project.partner?.name || null,
        }));

        return transformedProjects;
      } else {
        throw new Error(
          result.message?.message ||
            "Erreur lors de la récupération des projets",
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des projets par partenaire:",
        error,
      );
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Créer un nouveau projet
   */
  async createProject(
    projectData: CreateProjectFormData,
    userId: number,
    userEmail?: string,
  ): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log("📡 Création d'un nouveau projet...");

      const projectDataPayload: { title: string; partner_id?: number } = {
        title: projectData.title,
      };

      // N'inclure partner_id que s'il est défini et > 0
      if (projectData.partner_id && projectData.partner_id > 0) {
        projectDataPayload.partner_id = projectData.partner_id;
      }

      const requestBody: ProjectCreateRequest = {
        user: {
          id: userId,
          email: userEmail || '',
        },
        datas: [projectDataPayload],
      };

      console.log("📋 Données du projet à créer:", requestBody);

      const response = await fetch(buildApiUrl("/projects/create"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse création:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("❌ Détails de l'erreur:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          console.error("❌ Impossible de parser la réponse d'erreur");
        }
        throw new Error(errorMessage);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet créé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la création du projet:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Mettre à jour un projet
   */
  async updateProject(
    projectId: number,
    name: string,
    title: string,
    description?: string,
    partnerId?: number,
    isActive?: boolean,
    userId?: number,
    userEmail?: string,
  ): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Mise à jour du projet ${projectId}...`);

      const requestBody: ProjectUpdateRequest = {
        user: {
          id: userId || 0,
          email: userEmail || '',
        },
        datas: [
          {
            id: projectId,
            name: name,
            title: title,
            description: description,
            partner_id: partnerId,
            is_active: isActive,
          },
        ],
      };

      console.log("📋 Données de mise à jour:", requestBody);

      const response = await fetch(buildApiUrl("/projects/update"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse mise à jour:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("❌ Détails de l'erreur:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          console.error("❌ Impossible de parser la réponse d'erreur");
        }
        throw new Error(errorMessage);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet mis à jour avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour du projet:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Supprimer un projet (soft delete)
   */
  async deleteProject(
    projectId: number,
    projectTitle: string,
    userId: number,
    userEmail?: string,
  ): Promise<{ code: number; message: { code: number; message: string } }> {
    try {
      console.log(`📡 Suppression du projet ${projectId}...`);

      const requestBody: ProjectDeleteRequest = {
        user: {
          id: userId,
          email: userEmail || '',
        },
        datas: [
          {
            id: projectId,
            title: projectTitle,
          },
        ],
      };

      console.log("📋 Données de suppression:", requestBody);

      const response = await fetch(buildApiUrl("/projects/delete"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse suppression:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("❌ Détails de l'erreur:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          console.error("❌ Impossible de parser la réponse d'erreur");
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("✅ Projet supprimé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du projet:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Obtenir la liste des noms de partenaires pour la sélection
   */
  async getPartnerNames(): Promise<string[]> {
    try {
      console.log("📡 Récupération des noms de partenaires...");

      // Utiliser le service partners pour récupérer la liste
      const response = await fetch(buildApiUrl("/partners/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index: 0,
          size: 100,
          data: {
            is_active: true,
          },
        }),
      });

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Partenaires récupérés:", result);

      if (result.code === 200 && result.items) {
        // Extraire les noms des partenaires
        return result.items.map(
          (partner: any) => partner.name || partner.company_name,
        );
      } else {
        throw new Error(
          result.message?.message ||
            "Erreur lors de la récupération des partenaires",
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des partenaires:",
        error,
      );
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Obtenir une map des partenaires (id -> nom) pour la sélection
   */
  async getPartnersMap(): Promise<Map<string, string>> {
    try {
      console.log("📡 Récupération de la map des partenaires...");

      // Utiliser le service partners pour récupérer la liste
      const response = await fetch(buildApiUrl("/partners/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          index: 0,
          size: 100,
          data: {
            is_active: true,
          },
        }),
      });

      console.log("📨 Statut de la réponse:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Partenaires récupérés:", result);

      if (result.code === 200 && result.items) {
        // Créer une map id -> nom
        const partnersMap = new Map<string, string>();
        result.items.forEach((partner: any) => {
          partnersMap.set(
            partner.id.toString(),
            partner.name || partner.company_name,
          );
        });
        return partnersMap;
      } else {
        throw new Error(
          result.message?.message ||
            "Erreur lors de la récupération des partenaires",
        );
      }
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération de la map des partenaires:",
        error,
      );
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Clôturer un projet
   */
  async closeProject(
    projectId: number,
    closureReason: string,
    userId: number,
    userEmail?: string,
  ): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Clôture du projet ${projectId}...`);

      const requestBody = {
        user: {
          id: userId,
          email: userEmail || '',
        },
        closure_reason: closureReason,
      };

      console.log("📋 Données de clôture:", requestBody);

      const response = await fetch(buildApiUrl(`/projects/${projectId}/close`), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse clôture:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("❌ Détails de l'erreur:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          console.error("❌ Impossible de parser la réponse d'erreur");
        }
        throw new Error(errorMessage);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet clôturé avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la clôture du projet:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }

  /**
   * Réouvrir un projet clôturé
   */
  async reopenProject(
    projectId: number,
    userId: number,
    userEmail?: string,
  ): Promise<ProjectApiResponse<Project[]>> {
    try {
      console.log(`📡 Réouverture du projet ${projectId}...`);

      const requestBody = {
        user: {
          id: userId,
          email: userEmail || '',
        },
      };

      console.log("📋 Données de réouverture:", requestBody);

      const response = await fetch(buildApiUrl(`/projects/${projectId}/reopen`), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      console.log("📨 Statut de la réponse réouverture:", response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error("❌ Détails de l'erreur:", errorData);
          errorMessage = errorData.message || errorMessage;
        } catch {
          console.error("❌ Impossible de parser la réponse d'erreur");
        }
        throw new Error(errorMessage);
      }

      const result: ProjectApiResponse<Project[]> = await response.json();
      console.log("✅ Projet réouvert avec succès:", result);

      return result;
    } catch (error) {
      console.error("❌ Erreur lors de la réouverture du projet:", error);
      const message = extractBackendMessage(error);
      throw new Error(message);
    }
  }
}

// Instance exportée du service
export const projectsService = new ProjectsService();
