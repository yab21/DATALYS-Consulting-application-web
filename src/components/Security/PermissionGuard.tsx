'use client';

import React from 'react';
import { Card, CardBody, Button } from '@heroui/react';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Permission } from '@/lib/permissions';
import { usePermissions, useRoutePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions: Permission | Permission[];
  fallback?: React.ReactNode;
  redirectTo?: string;
  showFallback?: boolean;
}

// Composant principal pour protéger l'accès basé sur les permissions
export function PermissionGuard({ 
  children, 
  permissions, 
  fallback,
  redirectTo,
  showFallback = true
}: PermissionGuardProps) {
  const { hasAccess, loading, user } = useRoutePermissions(permissions);
  const router = useRouter();

  // Pendant le chargement
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté
  if (!user) {
    router.push('/connexion');
    return null;
  }

  // Si l'utilisateur a accès
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si fallback personnalisé fourni
  if (fallback) {
    return <>{fallback}</>;
  }

  // Si on ne doit pas afficher le fallback
  if (!showFallback) {
    if (redirectTo) {
      router.push(redirectTo);
    }
    return null;
  }

  // Fallback par défaut - Page d'accès refusé
  return <AccessDeniedFallback permissions={permissions} />;
}

// Composant pour les éléments d'interface conditionnels
interface ConditionalRenderProps {
  children: React.ReactNode;
  permissions: Permission | Permission[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // true = ET logique, false = OU logique (défaut)
}

export function ConditionalRender({ 
  children, 
  permissions, 
  fallback = null,
  requireAll = false 
}: ConditionalRenderProps) {
  const permissionsHook = usePermissions();

  if (!permissionsHook) return fallback as React.ReactElement;

  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  
  const hasAccess = requireAll 
    ? permissionsHook.hasAllPermissions(permissionsArray)
    : permissionsHook.hasAnyPermission(permissionsArray);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Composant pour protéger les boutons d'action
interface ProtectedButtonProps {
  permissions: Permission | Permission[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  [key: string]: any; // Pour les props du Button NextUI
}

export function ProtectedButton({ 
  permissions, 
  children, 
  fallback,
  disabled,
  ...buttonProps 
}: ProtectedButtonProps) {
  const permissionsHook = usePermissions();

  if (!permissionsHook) {
    return fallback ? <>{fallback}</> : null;
  }

  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  const hasAccess = permissionsHook.hasAnyPermission(permissionsArray);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <Button 
      {...buttonProps}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

// Composant pour afficher des informations basées sur le rôle
interface RoleBasedContentProps {
  adminContent?: React.ReactNode;
  partnerContent?: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleBasedContent({ 
  adminContent, 
  partnerContent, 
  fallback 
}: RoleBasedContentProps) {
  const permissions = usePermissions();

  if (!permissions) return fallback as React.ReactElement;

  if (permissions.isAdmin() && adminContent) {
    return <>{adminContent}</>;
  }

  if (permissions.isPartner() && partnerContent) {
    return <>{partnerContent}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// Page d'accès refusé par défaut
function AccessDeniedFallback({ permissions }: { permissions: Permission | Permission[] }) {
  const router = useRouter();
  const permissionsHook = usePermissions();

  const permissionsArray = Array.isArray(permissions) ? permissions : [permissions];
  const permissionNames = permissionsArray.join(', ');

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (permissionsHook?.isAdmin()) {
      router.push('/tableaudebord');
    } else if (permissionsHook?.isPartner()) {
      router.push('/tableaudebord/mon-espace');
    } else {
      router.push('/tableaudebord');
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="text-center p-8">
          {/* Icône */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-danger-100 p-3">
              <Shield className="w-8 h-8 text-danger-600" />
            </div>
          </div>

          {/* Titre */}
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Accès Refusé
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.
          </p>

          {/* Détails techniques (en développement) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Permissions requises:</span>
              </div>
              <p className="text-yellow-700 text-xs mt-1 break-all">
                {permissionNames}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="bordered"
              startContent={<ArrowLeft className="w-4 h-4" />}
              onPress={handleGoBack}
            >
              Retour
            </Button>
            
            <Button
              color="primary"
              onPress={handleGoHome}
            >
              Tableau de bord
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// HOC pour protéger des pages entières
export function withPermissions<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermissions: Permission | Permission[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard permissions={requiredPermissions}>
        <WrappedComponent {...props} />
      </PermissionGuard>
    );
  };
}