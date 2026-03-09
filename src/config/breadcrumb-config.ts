// Configuration des breadcrumbs pour DATALYS Consulting
import { SecureStorage } from '@/lib/secure-storage';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export interface RouteConfig {
  pattern: string;
  label: string;
  parentRoute?: string;
  getDynamicLabel?: (params: Record<string, string>) => Promise<string>;
}

// Configuration des routes avec leurs labels et hiérarchie
export const BREADCRUMB_ROUTES: RouteConfig[] = [
  // Route racine
  {
    pattern: '/tableaudebord',
    label: 'Tableau de bord'
  },

  // Documentation
  {
    pattern: '/tableaudebord/documentation',
    label: 'Documentation',
    parentRoute: '/tableaudebord'
  },

  // Analytics
  {
    pattern: '/tableaudebord/analytics',
    label: 'Analytics & Reporting',
    parentRoute: '/tableaudebord'
  },

  // Gestion des utilisateurs
  {
    pattern: '/tableaudebord/gestion-utilisateurs',
    label: 'Gestion des Utilisateurs',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/gestion-utilisateurs/ajouter',
    label: 'Ajouter un Utilisateur',
    parentRoute: '/tableaudebord/gestion-utilisateurs'
  },

  // Incidents
  {
    pattern: '/tableaudebord/incidents',
    label: 'Gestion des Incidents',
    parentRoute: '/tableaudebord'
  },

  // Messages
  {
    pattern: '/tableaudebord/messages',
    label: 'Centre de Communication',
    parentRoute: '/tableaudebord'
  },

  // Mon espace
  {
    pattern: '/tableaudebord/mon-espace',
    label: 'Mon Espace',
    parentRoute: '/tableaudebord'
  },

  // Partenaires
  {
    pattern: '/tableaudebord/partenaire/liste',
    label: 'Liste des Partenaires',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/partenaire/ajouter',
    label: 'Ajouter un Partenaire',
    parentRoute: '/tableaudebord/partenaire/liste'
  },
  {
    pattern: '/tableaudebord/partenaire/[id]',
    label: 'Détails du Partenaire',
    parentRoute: '/tableaudebord/partenaire/liste',
    getDynamicLabel: async (params) => {
      try {
        // Vérifier si on est côté client
        if (typeof window === 'undefined') {
          return `Partenaire: ${params.id}`;
        }
        
        const token = SecureStorage.getItem('authToken');
        if (!token) {
          return `Partenaire: ${params.id}`;
        }
        
        // Récupérer le nom du partenaire depuis l'API via getByCriteria
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/proxy'}/partners/getByCriteria`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            index: 0,
            size: 100,
            data: {
              is_active: true
            }
          })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.code === 200 && result.items) {
            const partner = result.items.find((p: any) => p.id.toString() === params.id);
            if (partner) {
              return `Partenaire: ${partner.name}`;
            }
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la récupération du nom du partenaire:', error);
      }
      return `Partenaire: ${params.id}`;
    }
  },

  // Profil
  {
    pattern: '/tableaudebord/profil/voir',
    label: 'Mon Profil',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/profil/modifier',
    label: 'Modifier le Profil',
    parentRoute: '/tableaudebord/profil/voir'
  },
  {
    pattern: '/tableaudebord/profil/changermotdepasse',
    label: 'Changer le Mot de Passe',
    parentRoute: '/tableaudebord/profil/voir'
  },

  // Projets
  {
    pattern: '/tableaudebord/projet/ajouter',
    label: 'Nouveau Projet',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/projet/gerer',
    label: 'Gestion de Projet',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/projet/modifier/[id]',
    label: 'Modifier le Projet',
    parentRoute: '/tableaudebord/projet/gerer',
    getDynamicLabel: async (params) => {
      try {
        // Utiliser projectsService au lieu d'appel fetch direct
        // Temporairement désactivé pour éviter l'erreur 404
        console.log('Breadcrumb dynamique désactivé temporairement pour le projet:', params.id);
      } catch (error) {
        console.warn('Erreur lors de la récupération du nom du projet:', error);
      }
      return `Modifier le Projet: ${params.id}`;
    }
  },
  {
    pattern: '/tableaudebord/projet/pageprojet/[id]',
    label: 'Détails du Projet',
    parentRoute: '/tableaudebord/projet/gerer',
    getDynamicLabel: async (params) => {
      try {
        // Utiliser projectsService au lieu d'appel fetch direct
        // Temporairement désactivé pour éviter l'erreur 404
        console.log('Breadcrumb dynamique désactivé temporairement pour le projet:', params.id);
      } catch (error) {
        console.warn('Erreur lors de la récupération du nom du projet:', error);
      }
      return `Projet: ${params.id}`;
    }
  },


  // Recherche
  {
    pattern: '/tableaudebord/recherche',
    label: 'Recherche',
    parentRoute: '/tableaudebord'
  },

  // Support
  {
    pattern: '/tableaudebord/support',
    label: 'Support Technique',
    parentRoute: '/tableaudebord'
  },

  // Paramètres
  {
    pattern: '/tableaudebord/parametres',
    label: 'Paramètres',
    parentRoute: '/tableaudebord'
  },
  {
    pattern: '/tableaudebord/parametres/roles',
    label: 'Gestion des Rôles',
    parentRoute: '/tableaudebord/parametres'
  },
  {
    pattern: '/tableaudebord/parametres/permissions',
    label: 'Gestion des Permissions',
    parentRoute: '/tableaudebord/parametres'
  }
];

// Fonction utilitaire pour trouver une route par pattern
export const findRouteConfig = (pathname: string): RouteConfig | undefined => {
  return BREADCRUMB_ROUTES.find(route => {
    if (route.pattern.includes('[id]')) {
      // Pour les routes dynamiques, créer un regex pattern
      const regexPattern = route.pattern.replace(/\[id\]/g, '[^/]+');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(pathname);
    }
    return route.pattern === pathname;
  });
};

// Fonction pour extraire les paramètres d'une route dynamique
export const extractParams = (pathname: string, pattern: string): Record<string, string> => {
  const params: Record<string, string> = {};
  
  if (pattern.includes('[id]')) {
    const patternParts = pattern.split('/');
    const pathnameParts = pathname.split('/');
    
    patternParts.forEach((part, index) => {
      if (part === '[id]' && pathnameParts[index]) {
        params.id = pathnameParts[index];
      }
    });
  }
  
  return params;
};

// Cache pour les labels dynamiques
const labelCache = new Map<string, { label: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedLabel = (key: string): string | null => {
  const cached = labelCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.label;
  }
  labelCache.delete(key);
  return null;
};

export const setCachedLabel = (key: string, label: string): void => {
  labelCache.set(key, { label, timestamp: Date.now() });
};