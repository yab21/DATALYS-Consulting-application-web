"use client";

/**
 * Configurations contextuelles pour les pages incidents et support
 * Les deux utilisent la même table/API mais avec des contextes métier différents
 */

export interface PriorityConfig {
  code: string;
  label: string;
  description: string;
  color: 'danger' | 'warning' | 'primary' | 'default';
  sla?: {
    intervention: number; // minutes
    resolution: number; // minutes
  };
}

export interface StatusConfig {
  code: string;
  label: string;
  color: 'success' | 'warning' | 'danger' | 'primary' | 'default';
}

export interface ContextConfig {
  title: string;
  description: string;
  priorities: PriorityConfig[];
  statuses: StatusConfig[];
  showSLA: boolean;
  showClientSatisfaction: boolean;
  showTimers: boolean;
  defaultFilters: Record<string, any>;
  tableColumns: string[];
  permissions: {
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    assign: boolean;
  };
}

export const TICKET_CONTEXTS: Record<'incidents' | 'support', ContextConfig> = {
  incidents: {
    title: "Gestion des Incidents",
    description: "Gestion technique interne des incidents et problèmes techniques",
    priorities: [
      {
        code: "P0",
        label: "P0 - Critique",
        description: "Incident critique nécessitant une intervention immédiate",
        color: "danger"
      },
      {
        code: "P1",
        label: "P1 - Haute",
        description: "Incident haute priorité",
        color: "danger"
      },
      {
        code: "P2",
        label: "P2 - Moyenne",
        description: "Incident priorité moyenne",
        color: "warning"
      },
      {
        code: "P3",
        label: "P3 - Basse",
        description: "Incident basse priorité",
        color: "primary"
      },
      {
        code: "P4",
        label: "P4 - Mineure",
        description: "Incident mineur ou amélioration",
        color: "default"
      }
    ],
    statuses: [
      { code: "nouveau", label: "Nouveau", color: "primary" },
      { code: "en_cours", label: "En cours", color: "warning" },
      { code: "en_attente", label: "En attente", color: "default" },
      { code: "en_arbitrage", label: "En arbitrage", color: "primary" },
      { code: "resolu", label: "Résolu", color: "success" }
    ],
    showSLA: false,
    showClientSatisfaction: false,
    showTimers: false,
    defaultFilters: {
      type: "incident",
      status: ["nouveau", "en_cours", "en_attente", "en_arbitrage"]
    },
    tableColumns: [
      "incident_number",
      "title", 
      "priority",
      "status",
      "assigned_to",
      "created_at",
      "updated_at"
    ],
    permissions: {
      create: true,
      edit: true,
      delete: true,
      export: true,
      assign: true
    }
  },

  support: {
    title: "Support Technique",
    description: "Gestion des demandes de support clients avec SLA et satisfaction",
    priorities: [
      {
        code: "P1",
        label: "P1 - Critique",
        description: "Interruption totale de service - Métier bloqué, pas de contournement possible",
        color: "danger",
        sla: {
          intervention: 30, // 30 minutes
          resolution: 240   // 4 heures
        }
      },
      {
        code: "P2", 
        label: "P2 - Élevée",
        description: "Fonctionnalité majeure dégradée - Activité fortement perturbée, contournement limité",
        color: "danger",
        sla: {
          intervention: 60,  // 1 heure
          resolution: 480    // 1 jour (8h)
        }
      },
      {
        code: "P3",
        label: "P3 - Moyenne", 
        description: "Fonctionnalité non critique dégradée - Impact faible, solution de contournement disponible",
        color: "warning",
        sla: {
          intervention: 240, // 4 heures
          resolution: 2160   // 3 jours (24h)
        }
      },
      {
        code: "P4",
        label: "P4 - Faible",
        description: "Demande d'information, amélioration ou bug mineur - Aucun impact métier direct",
        color: "primary",
        sla: {
          intervention: 1440, // 1 jour
          resolution: 7200    // 5 jours (120h)
        }
      }
    ],
    statuses: [
      { code: "en_cours", label: "En cours", color: "warning" },
      { code: "resolu", label: "Résolu", color: "success" },
      { code: "en_attente", label: "En pause", color: "default" },
      { code: "en_arbitrage", label: "En Arbitrage", color: "primary" }
    ],
    showSLA: true,
    showClientSatisfaction: true,
    showTimers: true,
    defaultFilters: {
      type: "support",
      status: ["en_cours", "en_attente", "en_arbitrage"]
    },
    tableColumns: [
      "incident_number",
      "title",
      "priority", 
      "status",
      "client",
      "sla_status",
      "created_at",
      "time_remaining"
    ],
    permissions: {
      create: true,
      edit: true,
      delete: false, // Les tickets support ne se suppriment pas
      export: true,
      assign: true
    }
  }
};

/**
 * Utilitaires pour les contextes
 */
export const getContextConfig = (context: 'incidents' | 'support'): ContextConfig => {
  return TICKET_CONTEXTS[context];
};

export const getPriorityConfig = (context: 'incidents' | 'support', priorityCode: string): PriorityConfig | undefined => {
  return TICKET_CONTEXTS[context].priorities.find(p => p.code === priorityCode);
};

export const getStatusConfig = (context: 'incidents' | 'support', statusCode: string): StatusConfig | undefined => {
  return TICKET_CONTEXTS[context].statuses.find(s => s.code === statusCode);
};

/**
 * Calcul des SLA
 */
export const calculateSLAStatus = (
  ticket: any,
  priorityConfig: PriorityConfig
): {
  interventionStatus: 'ok' | 'warning' | 'exceeded';
  resolutionStatus: 'ok' | 'warning' | 'exceeded';
  timeRemaining: number; // minutes
  isOverdue: boolean;
} => {
  if (!priorityConfig.sla) {
    return {
      interventionStatus: 'ok',
      resolutionStatus: 'ok', 
      timeRemaining: 0,
      isOverdue: false
    };
  }

  const now = new Date();
  const createdAt = new Date(ticket.created_at);
  const elapsedMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
  
  const { intervention, resolution } = priorityConfig.sla;
  
  // Statut intervention (prise en charge)
  const interventionStatus = 
    elapsedMinutes <= intervention ? 'ok' : 
    elapsedMinutes <= intervention * 1.5 ? 'warning' : 'exceeded';
  
  // Statut résolution
  const resolutionStatus = 
    elapsedMinutes <= resolution ? 'ok' :
    elapsedMinutes <= resolution * 1.2 ? 'warning' : 'exceeded';
  
  // Temps restant pour résolution
  const timeRemaining = Math.max(0, resolution - elapsedMinutes);
  const isOverdue = elapsedMinutes > resolution;

  return {
    interventionStatus,
    resolutionStatus,
    timeRemaining,
    isOverdue
  };
};

export default TICKET_CONTEXTS;