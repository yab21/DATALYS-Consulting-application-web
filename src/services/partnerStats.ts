// Service pour récupérer les statistiques des partenaires
import { buildApiUrl, getDefaultHeaders } from "@/lib/api-config";
import { SecureStorage } from "@/lib/secure-storage";

export interface PartnerStats {
  projectsCount: number;
  incidentsCount: number;
  supportTicketsCount: number;
}

export class PartnerStatsService {
  /**
   * Obtenir les headers avec authentification
   */
  private static getAuthHeaders(): HeadersInit {
    const currentToken = typeof window !== "undefined" ? SecureStorage.getItem("authToken") : null;
    return {
      ...getDefaultHeaders(),
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
    };
  }

  /**
   * Récupère les statistiques complètes d'un partenaire
   */
  static async getPartnerStatistics(partnerId: number, partnerName: string): Promise<PartnerStats> {
    try {
      // 1. Récupérer les projets du partenaire via l'API /projects/getByCriteria
      const projectsCount = await this.getProjectsCountByPartnerName(partnerName);

      // 2. Récupérer les incidents via l'API /incidents/getByCriteria
      const incidentsCount = await this.getIncidentsCount();

      // 3. Récupérer les tickets de support via l'API /incidents/getByCriteria avec type="support"
      const supportTicketsCount = await this.getSupportTicketsCount();

      return {
        projectsCount,
        incidentsCount,
        supportTicketsCount
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques du partenaire:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        projectsCount: 0,
        incidentsCount: 0,
        supportTicketsCount: 0
      };
    }
  }

  /**
   * Récupère le nombre de projets pour un partenaire via l'API getByCriteria
   */
  private static async getProjectsCountByPartnerName(partnerName: string): Promise<number> {
    try {
      const requestBody = {
        index: 0,
        size: 1000, // Récupérer tous les projets
        data: {
          is_active: true
        }
      };

      const response = await fetch(buildApiUrl("/projects/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.items) {
        // Filtrer les projets qui appartiennent au partenaire
        const partnerProjects = result.items.filter((project: any) => {
          const projectPartnerName = project.partner?.name || '';
          return projectPartnerName.toLowerCase().includes(partnerName.toLowerCase()) ||
                 partnerName.toLowerCase().includes(projectPartnerName.toLowerCase());
        });
        
        return partnerProjects.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des projets:', error);
      return 0;
    }
  }

  /**
   * Récupère le nombre total d'incidents via l'API getByCriteria
   */
  private static async getIncidentsCount(): Promise<number> {
    try {
      const requestBody = {
        index: 0,
        size: 1000, // Récupérer tous les incidents
        data: {
          is_active: true
        }
      };

      const response = await fetch(buildApiUrl("/incidents/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.items) {
        // Filtrer pour exclure les tickets de support (type !== "support")
        const incidents = result.items.filter((incident: any) => incident.type !== 'support');
        return incidents.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des incidents:', error);
      return 0;
    }
  }

  /**
   * Récupère le nombre de tickets de support via l'API getByCriteria avec type="support"
   */
  private static async getSupportTicketsCount(): Promise<number> {
    try {
      const requestBody = {
        index: 0,
        size: 1000, // Récupérer tous les tickets de support
        data: {
          is_active: true,
          type: "support"
        }
      };

      const response = await fetch(buildApiUrl("/incidents/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.code === 200 && result.items) {
        return result.items.length;
      }
      
      return 0;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des tickets de support:', error);
      return 0;
    }
  }

  /**
   * Récupère uniquement le nombre de projets (plus rapide)
   */
  static async getPartnerProjectsCount(partnerName: string): Promise<number> {
    try {
      return await this.getProjectsCountByPartnerName(partnerName);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de projets:', error);
      return 0;
    }
  }

  /**
   * Récupère les statistiques de base avec cache local
   */
  static async getPartnerStatsWithCache(
    partnerId: number, 
    partnerName: string
  ): Promise<PartnerStats> {
    // Récupérer les nouvelles données directement
    const stats = await this.getPartnerStatistics(partnerId, partnerName);
    return stats;
  }
}

export default PartnerStatsService;