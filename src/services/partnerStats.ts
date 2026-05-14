// Service pour récupérer les statistiques des partenaires
import { buildApiUrl, getDefaultHeaders } from "@/lib/api-config";
import { SecureStorage } from "@/lib/secure-storage";
import { isTokenExpiredError } from "@/lib/api-interceptor";

export interface PartnerIncident {
  id: number;
  title: string;
  priority: string;
  status: string;
  project_id: number;
  type?: string;
}

export interface PartnerStats {
  projectsCount: number;
  incidentsCount: number;
  supportTicketsCount: number;
  incidentsList: PartnerIncident[];
  supportTicketsList: PartnerIncident[];
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
  static async getPartnerStatistics(_partnerId: number, partnerName: string): Promise<PartnerStats> {
    try {
      // 1. Récupérer les IDs des projets du partenaire (base pour les 3 cards)
      const partnerProjectIds = await this.getPartnerProjectIds(partnerName);
      const projectsCount = partnerProjectIds.length;

      // 2. Incidents filtrés par les projets du partenaire
      const incidentsList = await this.getIncidents(partnerProjectIds);

      // 3. Tickets de support filtrés par les projets du partenaire
      const supportTicketsList = await this.getSupportTickets(partnerProjectIds);

      return {
        projectsCount,
        incidentsCount: incidentsList.length,
        supportTicketsCount: supportTicketsList.length,
        incidentsList,
        supportTicketsList
      };

    } catch {
      return {
        projectsCount: 0,
        incidentsCount: 0,
        supportTicketsCount: 0,
        incidentsList: [],
        supportTicketsList: []
      };
    }
  }

  /**
   * Récupère les IDs des projets d'un partenaire
   */
  private static async getPartnerProjectIds(partnerName: string): Promise<number[]> {
    try {
      const requestBody = {
        index: 0,
        size: 1000,
        data: { is_active: true }
      };

      const response = await fetch(buildApiUrl("/projects/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.code === 200 && result.items) {
        const partnerProjects = result.items.filter((project: any) => {
          const projectPartnerName = project.partner?.name || project.partner_name || '';
          return projectPartnerName.toLowerCase().includes(partnerName.toLowerCase()) ||
                 partnerName.toLowerCase().includes(projectPartnerName.toLowerCase());
        });
        return partnerProjects.map((p: any) => p.id);
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Récupère les incidents actifs liés aux projets du partenaire
   */
  private static async getIncidents(partnerProjectIds: number[]): Promise<PartnerIncident[]> {
    if (partnerProjectIds.length === 0) return [];
    try {
      const requestBody = {
        index: 0,
        size: 1000,
        data: { is_active: true }
      };

      const response = await fetch(buildApiUrl("/incidents/getByCriteria"), {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.code === 200 && result.items) {
        return result.items.filter((incident: any) =>
          incident.type !== 'support' &&
          partnerProjectIds.includes(incident.project_id)
        );
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Récupère les tickets de support actifs liés aux projets du partenaire
   */
  private static async getSupportTickets(partnerProjectIds: number[]): Promise<PartnerIncident[]> {
    if (partnerProjectIds.length === 0) return [];
    try {
      const requestBody = {
        index: 0,
        size: 1000,
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (result.code === 200 && result.items) {
        return result.items.filter((ticket: any) =>
          partnerProjectIds.includes(ticket.project_id)
        );
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * Récupère uniquement le nombre de projets
   */
  static async getPartnerProjectsCount(partnerName: string): Promise<number> {
    try {
      const ids = await this.getPartnerProjectIds(partnerName);
      return ids.length;
    } catch {
      return 0;
    }
  }

  /**
   * Récupère les statistiques avec cache local
   */
  static async getPartnerStatsWithCache(
    partnerId: number,
    partnerName: string
  ): Promise<PartnerStats> {
    const stats = await this.getPartnerStatistics(partnerId, partnerName);
    return stats;
  }
}

export default PartnerStatsService;
