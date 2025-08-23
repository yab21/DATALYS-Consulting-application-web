"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LoadingState {
  isLoading: boolean;
  message?: string;
  type?: 'auth' | 'navigation' | 'data' | 'form' | 'logout' | 'general';
}

interface GlobalLoadingContextType {
  loading: LoadingState;
  showLoading: (message?: string, type?: LoadingState['type']) => void;
  hideLoading: () => void;
  setLoadingMessage: (message: string) => void;
  
  // Méthodes spécialisées pour différents types d'actions
  showAuthLoading: (message?: string) => void;
  showNavigationLoading: (message?: string) => void;
  showDataLoading: (message?: string) => void;
  showFormLoading: (message?: string) => void;
  showLogoutLoading: () => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | null>(null);

// Messages par défaut pour chaque type
const DEFAULT_MESSAGES: Record<NonNullable<LoadingState['type']>, string> = {
  auth: 'Connexion en cours...',
  navigation: 'Chargement de la page...',
  data: 'Chargement des données...',
  form: 'Traitement en cours...',
  logout: 'Déconnexion en cours...',
  general: 'Chargement...'
};

interface GlobalLoadingProviderProps {
  children: ReactNode;
}

export const GlobalLoadingProvider: React.FC<GlobalLoadingProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState<LoadingState>({
    isLoading: false,
    message: undefined,
    type: 'general'
  });

  const showLoading = useCallback((message?: string, type: LoadingState['type'] = 'general') => {
    const finalMessage = message || DEFAULT_MESSAGES[type];
    setLoading({
      isLoading: true,
      message: finalMessage,
      type
    });
  }, []);

  const hideLoading = useCallback(() => {
    setLoading({
      isLoading: false,
      message: undefined,
      type: 'general'
    });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoading(prev => ({
      ...prev,
      message
    }));
  }, []);

  // Méthodes spécialisées
  const showAuthLoading = useCallback((message?: string) => {
    showLoading(message, 'auth');
  }, [showLoading]);

  const showNavigationLoading = useCallback((message?: string) => {
    showLoading(message, 'navigation');
  }, [showLoading]);

  const showDataLoading = useCallback((message?: string) => {
    showLoading(message, 'data');
  }, [showLoading]);

  const showFormLoading = useCallback((message?: string) => {
    showLoading(message, 'form');
  }, [showLoading]);

  const showLogoutLoading = useCallback(() => {
    showLoading(DEFAULT_MESSAGES.logout, 'logout');
  }, [showLoading]);

  const value: GlobalLoadingContextType = {
    loading,
    showLoading,
    hideLoading,
    setLoadingMessage,
    showAuthLoading,
    showNavigationLoading,
    showDataLoading,
    showFormLoading,
    showLogoutLoading
  };

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
    </GlobalLoadingContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte de loading global
export const useGlobalLoading = (): GlobalLoadingContextType => {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};

export default GlobalLoadingContext;