"use client";

import { lazy, Suspense, ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/UI/Loading/LoadingSpinner";

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
  // Créer le composant lazy
  const LazyLoadedComponent = lazy(importFunc);

  // Fallback par défaut avec loading spinner élégant
  const defaultFallback = (
    <motion.div 
      className={`flex items-center justify-center min-h-[200px] ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <LoadingSpinner 
        size="lg" 
        text="Chargement du composant..." 
      />
    </motion.div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyLoadedComponent {...props} />
    </Suspense>
  );
};

export default LazyComponent;