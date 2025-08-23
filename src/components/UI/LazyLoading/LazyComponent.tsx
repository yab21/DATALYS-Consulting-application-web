"use client";

import { lazy, Suspense, ComponentType, ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

interface LazyComponentProps {
  importFunc: () => Promise<{ default: ComponentType<any> }>;
  fallback?: ReactNode;
  className?: string;
  [key: string]: any;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  importFunc,
  fallback,
  className = "",
  ...props
}) => {
  const { showLoading, hideLoading } = useGlobalLoading();
  
  // Créer le composant lazy
  const LazyLoadedComponent = lazy(importFunc);

  // Composant de fallback qui utilise le GlobalLoader
  const LoadingFallback = () => {
    useEffect(() => {
      showLoading("Chargement du composant...", "general");
      return () => hideLoading();
    }, []);

    return (
      <motion.div 
        className={`flex items-center justify-center min-h-[200px] ${className}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Le GlobalLoader s'occupera de l'affichage */}
      </motion.div>
    );
  };

  // Fallback par défaut qui utilise le GlobalLoader
  const defaultFallback = <LoadingFallback />;

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyLoadedComponent {...props} />
    </Suspense>
  );
};

export default LazyComponent;