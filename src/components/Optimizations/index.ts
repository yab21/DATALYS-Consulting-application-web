// Performance Optimizations exports pour DATALYS Consulting
import React from "react";

// Lazy Loading Components
export { default as LazyComponent } from "@/components/UI/LazyLoading/LazyComponent";
export { default as LazyImage, LazyAvatar, LazyImageGrid } from "@/components/UI/LazyLoading/LazyImage";

// Skeletons & Loading States  
export { default as Skeleton, SkeletonCard, SkeletonTable, SkeletonDashboard } from "@/components/UI/LazyLoading/SkeletonLoader";
export { default as LoadingSpinner } from "@/components/UI/Loading/LoadingSpinner";

// Virtualized & High Performance Tables
export { default as VirtualizedTable } from "@/components/UI/VirtualizedTable/VirtualizedTable";

// API Caching Hooks
export { 
  useApiCache, 
  useUserCache, 
  useProjectCache, 
  useDashboardCache,
  apiCache 
} from "@/hooks/useApiCache";

// Optimized Forms
export { useOptimizedForm } from "@/hooks/useOptimizedForm";

// Notifications System
export { 
  useSimpleNotifications, 
  SimpleNotificationProvider,
  simpleNotificationHelpers 
} from "@/components/UI/Notifications/SimpleNotificationSystem";

// Optimized Components Examples
export { default as OptimizedProjectList } from "@/components/TableauDeBord/Projet/OptimizedProjectList";

// Performance Utilities
export const PerformanceConfig = {
  // Cache TTL configurations
  CACHE_TTL: {
    SHORT: 30 * 1000,        // 30 seconds - pour dashboard/temps réel
    MEDIUM: 5 * 60 * 1000,   // 5 minutes - pour listes/données dynamiques  
    LONG: 30 * 60 * 1000,    // 30 minutes - pour rapports/données statiques
    STATIC: 60 * 60 * 1000,  // 1 heure - pour référentiels/config
  },
  
  // Stale time configurations
  STALE_TIME: {
    SHORT: 15 * 1000,        // 15 seconds
    MEDIUM: 2 * 60 * 1000,   // 2 minutes
    LONG: 10 * 60 * 1000,    // 10 minutes
    STATIC: 30 * 60 * 1000,  // 30 minutes
  },
  
  // Virtualization thresholds
  VIRTUALIZATION: {
    ENABLE_AT: 100,    // Activer virtualisation à partir de 100 items
    FORCE_AT: 1000,    // Forcer virtualisation à partir de 1000 items
    ITEM_HEIGHT: 60,   // Hauteur par défaut des items
    OVERSCAN: 5,       // Nombre d'items à pré-rendre
  },
  
  // Image optimization
  IMAGE_OPTIMIZATION: {
    QUALITY: 85,              // Qualité par défaut des images
    LAZY_LOADING_MARGIN: 50,  // Marge en px pour le lazy loading
    PLACEHOLDER_BLUR: true,   // Activer le flou sur les placeholders
  },
  
  // Form optimization
  FORM_OPTIMIZATION: {
    DEBOUNCE_DELAY: 300,      // Délai de debounce pour validation
    AUTO_SAVE_DELAY: 3000,    // Délai pour auto-save
    DRAFT_MAX_AGE: 24 * 60 * 60 * 1000, // 24h max pour les drafts
  },
  
  // Bundle optimization targets
  PERFORMANCE_TARGETS: {
    BUNDLE_SIZE_LIMIT: 2 * 1024 * 1024,  // 2MB max bundle initial
    TTI_TARGET: 3000,                     // 3s Time To Interactive max
    FCP_TARGET: 1500,                     // 1.5s First Contentful Paint max
    API_TIMEOUT: 10000,                   // 10s timeout API calls
  }
};

// Performance measurement helpers
export const PerformanceUtils = {
  // Mesurer le temps d'exécution d'une fonction
  measurePerformance: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const end = performance.now();
      console.log(`[PERF] ${name}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`[PERF ERROR] ${name}: ${(end - start).toFixed(2)}ms`, error);
      throw error;
    }
  },

  // Créer un observateur de performance pour les métriques Web Vitals
  observeWebVitals: () => {
    if (typeof window === 'undefined') return;

    // Observer FCP (First Contentful Paint)
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntriesByName('first-contentful-paint');
      if (entries.length > 0) {
        const fcp = entries[0].startTime;
        console.log(`[WEB VITALS] FCP: ${fcp.toFixed(2)}ms`);
      }
    });
    
    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('Performance Observer not supported');
    }

    // Observer les métriques de navigation
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log('[WEB VITALS] Navigation Timing:', {
          DNS: `${navigation.domainLookupEnd - navigation.domainLookupStart}ms`,
          TCP: `${navigation.connectEnd - navigation.connectStart}ms`,
          Request: `${navigation.responseStart - navigation.requestStart}ms`,
          Response: `${navigation.responseEnd - navigation.responseStart}ms`,
          DOM: `${navigation.domContentLoadedEventEnd - navigation.responseEnd}ms`,
          Total: `${navigation.loadEventEnd - navigation.fetchStart}ms`
        });
      }
    });
  },

  // Mesurer la taille du bundle JavaScript
  measureBundleSize: () => {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const totalSize = jsResources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
    
    console.log(`[BUNDLE SIZE] Total JS: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    return totalSize;
  },

  // Créer un rapport de performance
  generatePerformanceReport: () => {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    return {
      timestamp: new Date().toISOString(),
      navigation: {
        ttfb: navigation.responseStart - navigation.requestStart, // Time To First Byte
        domLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        fullyLoaded: navigation.loadEventEnd - navigation.fetchStart,
      },
      resources: {
        total: resources.length,
        javascript: resources.filter(r => r.name.includes('.js')).length,
        css: resources.filter(r => r.name.includes('.css')).length,
        images: resources.filter(r => /\.(jpg|jpeg|png|gif|svg|webp)/.test(r.name)).length,
      },
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
      } : null
    };
  }
};

// HOC pour lazy loading de composants
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
): React.ComponentType<P> {
  const LazyLoadedComponent = React.lazy(importFunc);
  
  const WrappedComponent: React.ComponentType<P> = (props: P) => {
    return React.createElement(
      React.Suspense,
      { fallback: fallback || React.createElement('div', { className: 'loading' }, 'Loading...') },
      React.createElement(LazyLoadedComponent, props as any)
    );
  };
  
  WrappedComponent.displayName = `LazyLoaded(Component)`;
  
  return WrappedComponent;
}

// HOC pour cache automatique des données
export function withDataCache<P extends object, T>(
  Component: React.ComponentType<P & { data: T }>,
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: any
) {
  const CachedComponent = (props: P) => {
    // Note: useApiCache would be used here in a real implementation
    // For now, returning a simple wrapper
    return React.createElement(Component, { ...props, data: null as any });
  };
  
  CachedComponent.displayName = `WithDataCache(${Component.displayName || Component.name || 'Component'})`;
  
  return CachedComponent;
}