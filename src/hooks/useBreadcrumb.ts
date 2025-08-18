"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  BreadcrumbItem, 
  BREADCRUMB_ROUTES, 
  findRouteConfig, 
  extractParams,
  getCachedLabel,
  setCachedLabel
} from '@/config/breadcrumb-config';

export interface UseBreadcrumbReturn {
  breadcrumbs: BreadcrumbItem[];
  isLoading: boolean;
  currentPageTitle: string;
}

export const useBreadcrumb = (): UseBreadcrumbReturn => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPageTitle, setCurrentPageTitle] = useState('');

  useEffect(() => {
    const generateBreadcrumbs = async () => {
      setIsLoading(true);
      
      try {
        const currentRoute = findRouteConfig(pathname);
        if (!currentRoute) {
          // Route non configurée, utiliser un breadcrumb simple
          setBreadcrumbs([
            { label: 'Tableau de bord', href: '/tableaudebord' },
            { label: 'Page', href: pathname, isActive: true }
          ]);
          setCurrentPageTitle('Page');
          return;
        }

        const breadcrumbChain: BreadcrumbItem[] = [];
        
        // Construire la chaîne de breadcrumbs en remontant vers le parent
        let currentConfig = currentRoute;
        const processedRoutes: string[] = [];
        
        while (currentConfig && !processedRoutes.includes(currentConfig.pattern)) {
          processedRoutes.push(currentConfig.pattern);
          
          let label = currentConfig.label;
          let href = currentConfig.pattern;
          
          // Gérer les routes dynamiques
          if (currentConfig.pattern.includes('[id]')) {
            const params = extractParams(pathname, currentConfig.pattern);
            href = pathname; // Utiliser le vrai pathname pour les routes dynamiques
            
            // Récupérer le label dynamique si la fonction existe
            if (currentConfig.getDynamicLabel && params.id) {
              const cacheKey = `${currentConfig.pattern}_${params.id}`;
              let cachedLabel = getCachedLabel(cacheKey);
              
              if (!cachedLabel) {
                try {
                  const dynamicLabel = await currentConfig.getDynamicLabel(params);
                  setCachedLabel(cacheKey, dynamicLabel);
                  cachedLabel = dynamicLabel;
                } catch (error) {
                  console.warn('Erreur lors de la récupération du label dynamique:', error);
                  cachedLabel = `${currentConfig.label}: ${params.id}`;
                }
              }
              
              label = cachedLabel;
            }
          }
          
          // Ajouter au début de la chaîne (pour avoir l'ordre correct)
          breadcrumbChain.unshift({
            label,
            href,
            isActive: currentConfig.pattern === currentRoute.pattern
          });
          
          // Passer au parent
          if (currentConfig.parentRoute) {
            const parentRoute = BREADCRUMB_ROUTES.find(route => 
              route.pattern === currentConfig!.parentRoute
            );
            if (parentRoute) {
              currentConfig = parentRoute;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        // S'assurer que le tableau de bord est toujours en premier
        if (breadcrumbChain.length > 0 && breadcrumbChain[0].href !== '/tableaudebord') {
          breadcrumbChain.unshift({
            label: 'Tableau de bord',
            href: '/tableaudebord'
          });
        }
        
        setBreadcrumbs(breadcrumbChain);
        
        // Définir le titre de la page actuelle
        const activeItem = breadcrumbChain.find(item => item.isActive);
        setCurrentPageTitle(activeItem?.label || currentRoute.label);
        
      } catch (error) {
        console.error('Erreur lors de la génération des breadcrumbs:', error);
        // Fallback en cas d'erreur
        setBreadcrumbs([
          { label: 'Tableau de bord', href: '/tableaudebord' },
          { label: 'Page', href: pathname, isActive: true }
        ]);
        setCurrentPageTitle('Page');
      } finally {
        setIsLoading(false);
      }
    };

    generateBreadcrumbs();
  }, [pathname]);

  return {
    breadcrumbs,
    isLoading,
    currentPageTitle
  };
};