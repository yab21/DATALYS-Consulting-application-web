'use client';

import { useContext, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { 
  Permission, 
  PermissionManager, 
  UserWithPermissions,
  getCRUDPermissions,
  CRUDPermissions 
} from '@/lib/permissions';

export function usePermissions() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('usePermissions must be used within an AuthProvider');
  }
  
  const { user } = context;

  const permissions = useMemo(() => {
    if (!user) return null;

    const currentUser = user as UserWithPermissions;

    return {
      // Vérifier une permission spécifique
      hasPermission: (permission: Permission) => 
        PermissionManager.hasPermission(currentUser, permission),

      // Vérifier plusieurs permissions (OU logique)
      hasAnyPermission: (permissions: Permission[]) => 
        PermissionManager.hasAnyPermission(currentUser, permissions),

      // Vérifier plusieurs permissions (ET logique)
      hasAllPermissions: (permissions: Permission[]) => 
        PermissionManager.hasAllPermissions(currentUser, permissions),

      // Vérifications de rôle
      isAdmin: () => PermissionManager.isAdmin(currentUser),
      isPartner: () => PermissionManager.isPartner(currentUser),

      // Vérifications d'accès spécifiques
      canAccessProject: (projectPartnerId: number) => 
        PermissionManager.canAccessProject(currentUser, projectPartnerId),
      canModify: () => PermissionManager.canModify(currentUser),
      canDelete: () => PermissionManager.canDelete(currentUser),
      canCreate: () => PermissionManager.canCreate(currentUser),

      // Obtenir les permissions CRUD pour un type d'entité
      getCRUDPermissions: (entityType: 'projects' | 'partners' | 'users' | 'documents') =>
        getCRUDPermissions(currentUser, entityType),

      // Filtrer les données selon les permissions
      filterProjectsByPermissions: (projects: any[]) => 
        PermissionManager.filterProjectsByPermissions(currentUser, projects),

      // Obtenir toutes les permissions de l'utilisateur
      getAllPermissions: () => PermissionManager.getUserPermissions(currentUser),

      // Informations utilisateur
      user: currentUser,
      partnerId: currentUser.partner_id,
      userId: currentUser.id,
      roleId: currentUser.role_id
    };
  }, [user]);

  return permissions;
}

// Hook spécialisé pour les permissions CRUD
export function useCRUDPermissions(entityType: 'projects' | 'partners' | 'users' | 'documents'): CRUDPermissions | null {
  const permissions = usePermissions();
  
  return useMemo(() => {
    if (!permissions) return null;
    return permissions.getCRUDPermissions(entityType);
  }, [permissions, entityType]);
}

// Hook pour vérifier l'accès à une route
export function useRoutePermissions(requiredPermissions: Permission | Permission[]) {
  const permissions = usePermissions();

  return useMemo(() => {
    if (!permissions) return { hasAccess: false, loading: true };

    const permissionsArray = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];

    const hasAccess = permissions.hasAnyPermission(permissionsArray);

    return {
      hasAccess,
      loading: false,
      user: permissions.user,
      redirectTo: hasAccess ? null : '/unauthorized'
    };
  }, [permissions, requiredPermissions]);
}

// Hook pour les permissions sur les projets spécifiques
export function useProjectPermissions(projectPartnerId?: number) {
  const permissions = usePermissions();

  return useMemo(() => {
    if (!permissions) return { canAccess: false, loading: true };

    const canAccess = projectPartnerId 
      ? permissions.canAccessProject(projectPartnerId)
      : permissions.hasPermission(Permission.ACCESS_ALL_PROJECTS);

    return {
      canAccess,
      canModify: permissions.canModify(),
      canDelete: permissions.canDelete(),
      canCreate: permissions.canCreate(),
      loading: false,
      isAdmin: permissions.isAdmin(),
      isPartner: permissions.isPartner(),
      user: permissions.user
    };
  }, [permissions, projectPartnerId]);
}