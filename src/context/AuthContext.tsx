"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService } from '@/services/auth';
import { ApiResponse, LoginResponse } from '@/lib/api-config';

// Types
interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  role_id: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider d'authentification
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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
          setUser(JSON.parse(storedUser));
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
          created_at: response.data.created_at,
          updated_at: response.data.updated_at,
        };

        setUser(userData);
        setToken(response.data.token);

        // Les données sont automatiquement sauvegardées par AuthService.login
      } else {
        throw new Error(response.message || 'Erreur de connexion');
      }
    } catch (error) {
      // Nettoyer l'état en cas d'erreur
      setUser(null);
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
    setToken(null);
    
    // Nettoyer les données d'authentification
    AuthService.clearAuthData();
  };

  const contextValue: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
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