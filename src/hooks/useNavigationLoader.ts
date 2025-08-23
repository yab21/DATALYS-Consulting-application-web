"use client";

import { useRouter } from 'next/navigation';
import { useGlobalLoading } from '@/context/GlobalLoadingContext';
import { useCallback } from 'react';

export interface NavigationOptions {
  loadingMessage?: string;
  delay?: number;
}

export const useNavigationLoader = () => {
  const router = useRouter();
  const { showNavigationLoading, hideLoading } = useGlobalLoading();

  const navigateWithLoader = useCallback(
    (
      path: string, 
      options: NavigationOptions = {}
    ) => {
      const { loadingMessage = 'Chargement de la page...', delay = 500 } = options;
      
      // Afficher le loader de navigation
      showNavigationLoading(loadingMessage);
      
      // Naviguer après un léger délai pour l'effet visuel
      setTimeout(() => {
        router.push(path);
        
        // Masquer le loader après un délai pour permettre à la nouvelle page de se charger
        setTimeout(() => {
          hideLoading();
        }, 300);
      }, delay);
    },
    [router, showNavigationLoading, hideLoading]
  );

  const replaceWithLoader = useCallback(
    (
      path: string, 
      options: NavigationOptions = {}
    ) => {
      const { loadingMessage = 'Chargement de la page...', delay = 500 } = options;
      
      showNavigationLoading(loadingMessage);
      
      setTimeout(() => {
        router.replace(path);
        setTimeout(() => {
          hideLoading();
        }, 300);
      }, delay);
    },
    [router, showNavigationLoading, hideLoading]
  );

  const backWithLoader = useCallback(
    (options: NavigationOptions = {}) => {
      const { loadingMessage = 'Retour à la page précédente...', delay = 300 } = options;
      
      showNavigationLoading(loadingMessage);
      
      setTimeout(() => {
        router.back();
        setTimeout(() => {
          hideLoading();
        }, 300);
      }, delay);
    },
    [router, showNavigationLoading, hideLoading]
  );

  return {
    navigateWithLoader,
    replaceWithLoader,
    backWithLoader
  };
};

export default useNavigationLoader;