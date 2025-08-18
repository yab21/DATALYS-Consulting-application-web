"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth';
import { ApiResponse, LoginResponse } from '@/lib/api-config';
import { 
  UserWithPermissions, 
  Permission, 
  PermissionManager, 
  getCRUDPermissions,
  CRUDPermissions 
} from '@/lib/permissions';

// Types étendus avec permissions
interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  role_id: number;
  partner_id?: number; // ID du partenaire associé (pour les clients)
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userWithPermissions: UserWithPermissions | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  // Helpers pour les permissions
  hasPermission: (permission: Permission) => boolean;
  isAdmin: () => boolean;
  isPartner: () => boolean;
  canAccessProject: (projectPartnerId: number) => boolean;
  canModify: () => boolean;
  canDelete: () => boolean;
  canCreate: () => boolean;
  getCRUDPermissions: (entityType: 'projects' | 'partners' | 'users' | 'documents') => CRUDPermissions;
}

// Contexte d'authentification
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userWithPermissions, setUserWithPermissions] = useState<UserWithPermissions | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données d'authentification au démarrage
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('userInfo');

        if (storedToken && storedUser) {
          setToken(storedToken);
          const userData = JSON.parse(storedUser);
          setUser(userData);
          
          // Créer l'utilisateur avec permissions
          const userWithPerms: UserWithPermissions = {
            ...userData,
            permissions: PermissionManager.getUserPermissions(userData)
          };
          setUserWithPermissions(userWithPerms);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données d\'authentification:', error);
        // Nettoyer les données corrompues
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthData();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);

      const response = await AuthService.login({ email, password });

      if (response.status === 'success' && response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          is_active: response.data.is_active,
          role_id: response.data.role_id,
          partner_id: response.data.partner_id, // Ajouter partner_id depuis l'API
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
        };

        setUser(userData);
        setToken(response.data.token);

        // Créer l'utilisateur avec permissions
        const userWithPerms: UserWithPermissions = {
          ...userData,
          permissions: PermissionManager.getUserPermissions(userData)
        };
        setUserWithPermissions(userWithPerms);

        // Les données sont automatiquement sauvegardées par AuthService.login
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      // Nettoyer l'état en cas d'erreur
      setUser(null);
      setUserWithPermissions(null);
      setToken(null);
      AuthService.clearAuthData();
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = (): void => {
    setUser(null);
    setUserWithPermissions(null);
    setToken(null);
    
    // Nettoyer les données d'authentification
    AuthService.clearAuthData();
  };

  // Helpers pour les permissions
  const hasPermission = (permission: Permission): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.hasPermission(userWithPermissions, permission);
  };

  const isAdmin = (): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.isAdmin(userWithPermissions);
  };

  const isPartner = (): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.isPartner(userWithPermissions);
  };

  const canAccessProject = (projectPartnerId: number): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.canAccessProject(userWithPermissions, projectPartnerId);
  };

  const canModify = (): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.canModify(userWithPermissions);
  };

  const canDelete = (): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.canDelete(userWithPermissions);
  };

  const canCreate = (): boolean => {
    if (!userWithPermissions) return false;
    return PermissionManager.canCreate(userWithPermissions);
  };

  const getCRUDPermissionsHelper = (entityType: 'projects' | 'partners' | 'users' | 'documents'): CRUDPermissions => {
    if (!userWithPermissions) {
      return { canRead: false, canCreate: false, canUpdate: false, canDelete: false };
    }
    return getCRUDPermissions(userWithPermissions, entityType);
  };

  const contextValue: AuthContextType = {
    user,
    userWithPermissions,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    hasPermission,
    isAdmin,
    isPartner,
    canAccessProject,
    canModify,
    canDelete,
    canCreate,
    getCRUDPermissions: getCRUDPermissionsHelper,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
};

export default AuthContext;