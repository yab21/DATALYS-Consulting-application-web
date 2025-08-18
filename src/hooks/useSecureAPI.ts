'use client';

import { useCallback, useMemo } from 'react';
import { usePermissions } from './usePermissions';
import { Permission } from '@/lib/permissions';

interface SecureApiOptions {
  requirePermissions?: Permission | Permission[];
  requireAll?: boolean; // true = ET logique, false = OU logique (défaut)
  validateData?: (data: any) => { valid: boolean; errors?: string[] };
  filterResponse?: (data: any) => any;
}

interface SecureApiResult<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  hasPermission: boolean;
}

// Hook pour sécuriser les appels API côté client
export function useSecureAPI() {
  const permissions = usePermissions();

  // Fonction pour valider les permissions avant un appel API
  const validatePermissions = useCallback((
    requiredPermissions?: Permission | Permission[],
    requireAll: boolean = false
  ): { valid: boolean; error?: string } => {
    if (!permissions) {
      return { valid: false, error: 'Utilisateur non authentifié' };
    }

    if (!requiredPermissions) {
      return { valid: true };
    }

    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    const hasAccess = requireAll 
      ? permissions.hasAllPermissions(permissionsArray)
      : permissions.hasAnyPermission(permissionsArray);

    if (!hasAccess) {
      return { 
        valid: false, 
        error: `Permissions insuffisantes. Requis: ${permissionsArray.join(', ')}` 
      };
    }

    return { valid: true };
  }, [permissions]);

  // Fonction pour filtrer les données selon les permissions utilisateur
  const filterDataByPermissions = useCallback((data: any, entityType?: string) => {
    if (!permissions) return null;

    // Si admin, retourner toutes les données
    if (permissions.isAdmin()) {
      return data;
    }

    // Si partenaire, filtrer selon le partner_id
    if (permissions.isPartner() && permissions.partnerId) {
      if (Array.isArray(data)) {
        return data.filter(item => item.partner_id === permissions.partnerId);
      } else if (data && typeof data === 'object') {
        if (data.partner_id === permissions.partnerId) {
          return data;
        }
        return null;
      }
    }

    return data;
  }, [permissions]);

  // Wrapper sécurisé pour les appels fetch
  const secureCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: SecureApiOptions = {}
  ): Promise<SecureApiResult<T>> => {
    try {
      // Vérifier les permissions
      const permissionCheck = validatePermissions(
        options.requirePermissions, 
        options.requireAll
      );

      if (!permissionCheck.valid) {
        return {
          data: null,
          error: permissionCheck.error || 'Accès refusé',
          loading: false,
          hasPermission: false
        };
      }

      // Exécuter l'appel API
      const result = await apiCall();

      // Filtrer la réponse si nécessaire
      const filteredResult = options.filterResponse 
        ? options.filterResponse(result)
        : filterDataByPermissions(result);

      return {
        data: filteredResult,
        error: null,
        loading: false,
        hasPermission: true
      };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false,
        hasPermission: true
      };
    }
  }, [validatePermissions, filterDataByPermissions]);

  // Validation des données avant envoi
  const validateAndSend = useCallback(async <T, D>(
    data: D,
    apiCall: (data: D) => Promise<T>,
    options: SecureApiOptions = {}
  ): Promise<SecureApiResult<T>> => {
    try {
      // Vérifier les permissions
      const permissionCheck = validatePermissions(
        options.requirePermissions, 
        options.requireAll
      );

      if (!permissionCheck.valid) {
        return {
          data: null,
          error: permissionCheck.error || 'Accès refusé',
          loading: false,
          hasPermission: false
        };
      }

      // Valider les données si fonction fournie
      if (options.validateData) {
        const validation = options.validateData(data);
        if (!validation.valid) {
          return {
            data: null,
            error: `Données invalides: ${validation.errors?.join(', ')}`,
            loading: false,
            hasPermission: true
          };
        }
      }

      // Exécuter l'appel API
      const result = await apiCall(data);

      return {
        data: result,
        error: null,
        loading: false,
        hasPermission: true
      };

    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi',
        loading: false,
        hasPermission: true
      };
    }
  }, [validatePermissions]);

  // Helpers pour les opérations CRUD sécurisées
  const secureCRUD = useMemo(() => ({
    // Lecture sécurisée
    read: <T>(
      apiCall: () => Promise<T>,
      requiredPermissions?: Permission | Permission[]
    ) => secureCall(apiCall, { requirePermissions: requiredPermissions }),

    // Création sécurisée
    create: <T, D>(
      data: D,
      apiCall: (data: D) => Promise<T>,
      options: {
        requiredPermissions?: Permission | Permission[];
        validateData?: (data: D) => { valid: boolean; errors?: string[] };
      } = {}
    ) => validateAndSend(data, apiCall, {
      requirePermissions: options.requiredPermissions,
      validateData: options.validateData
    }),

    // Mise à jour sécurisée
    update: <T, D>(
      data: D,
      apiCall: (data: D) => Promise<T>,
      options: {
        requiredPermissions?: Permission | Permission[];
        validateData?: (data: D) => { valid: boolean; errors?: string[] };
        validateOwnership?: (data: D) => boolean;
      } = {}
    ) => {
      // Validation supplémentaire de propriété pour les partenaires
      if (permissions?.isPartner() && options.validateOwnership) {
        if (!options.validateOwnership(data)) {
          return Promise.resolve({
            data: null,
            error: 'Vous ne pouvez modifier que vos propres données',
            loading: false,
            hasPermission: false
          });
        }
      }

      return validateAndSend(data, apiCall, {
        requirePermissions: options.requiredPermissions,
        validateData: options.validateData
      });
    },

    // Suppression sécurisée
    delete: <T>(
      apiCall: () => Promise<T>,
      options: {
        requiredPermissions?: Permission | Permission[];
        confirmDeletion?: boolean;
      } = {}
    ) => {
      if (options.confirmDeletion && !confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        return Promise.resolve({
          data: null,
          error: 'Suppression annulée',
          loading: false,
          hasPermission: true
        });
      }

      return secureCall(apiCall, { requirePermissions: options.requiredPermissions });
    }
  }), [secureCall, validateAndSend, permissions]);

  return {
    // Fonctions principales
    secureCall,
    validateAndSend,
    validatePermissions,
    filterDataByPermissions,
    
    // CRUD sécurisé
    ...secureCRUD,

    // Informations utilisateur
    user: permissions?.user,
    isAdmin: permissions?.isAdmin(),
    isPartner: permissions?.isPartner(),
    partnerId: permissions?.partnerId,
    
    // État
    isAuthenticated: !!permissions,
    hasPermission: (permission: Permission) => permissions?.hasPermission(permission) || false
  };
}

// Hook spécialisé pour les opérations sur les projets
export function useSecureProjectAPI() {
  const secureAPI = useSecureAPI();

  return {
    ...secureAPI,
    
    // Lecture des projets avec filtrage automatique
    getProjects: (apiCall: () => Promise<any[]>) => 
      secureAPI.read(apiCall, [Permission.ACCESS_ALL_PROJECTS, Permission.VIEW_OWN_PROJECTS]),

    // Création de projet (admin seulement)
    createProject: (data: any, apiCall: (data: any) => Promise<any>) =>
      secureAPI.create(data, apiCall, {
        requiredPermissions: Permission.CREATE_PROJECTS_ALL_PARTNERS,
        validateData: (projectData) => {
          const errors = [];
          if (!projectData.title?.trim()) errors.push('Titre requis');
          if (!projectData.partner_id) errors.push('Partenaire requis');
          return { valid: errors.length === 0, errors };
        }
      }),

    // Mise à jour de projet
    updateProject: (data: any, apiCall: (data: any) => Promise<any>) =>
      secureAPI.update(data, apiCall, {
        requiredPermissions: Permission.MODIFY_ALL_PROJECTS,
        validateOwnership: (projectData) => {
          // Les partenaires ne peuvent pas modifier les projets
          return secureAPI.isAdmin || false;
        }
      }),

    // Suppression de projet (admin seulement)
    deleteProject: (apiCall: () => Promise<any>) =>
      secureAPI.delete(apiCall, {
        requiredPermissions: Permission.DELETE_PROJECTS,
        confirmDeletion: true
      })
  };
}