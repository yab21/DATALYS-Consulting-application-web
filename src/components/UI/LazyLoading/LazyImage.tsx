"use client";

import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, Loader2 } from "lucide-react";

interface LazyImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  placeholder?: string;
  blurDataURL?: string;
  priority?: boolean;
  quality?: number;
  className?: string;
  containerClassName?: string;
  onLoad?: (event: Event) => void;
  onError?: (event: Event) => void;
  fallback?: React.ReactNode;
  aspectRatio?: number;
  showLoading?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  blurDataURL,
  priority = false,
  quality = 85,
  className = "",
  containerClassName = "",
  onLoad,
  onError,
  fallback,
  aspectRatio,
  showLoading = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(!priority);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer pour le lazy loading
  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const currentContainer = containerRef.current;
    if (currentContainer) {
      observer.observe(currentContainer);
    }

    return () => {
      if (currentContainer) {
        observer.unobserve(currentContainer);
      }
    };
  }, [priority]);

  // Précharger l'image
  useEffect(() => {
    if (!isInView) return;

    const img = new Image();
    
    img.onload = (event) => {
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.(event as Event);
    };
    
    img.onerror = (event) => {
      setHasError(true);
      setIsLoading(false);
      onError?.(event as Event);
    };

    // Optimiser l'URL de l'image
    const optimizedSrc = optimizeImageUrl(src, quality);
    img.src = optimizedSrc;
  }, [isInView, src, quality, onLoad, onError]);

  // Fonction pour optimiser l'URL de l'image
  const optimizeImageUrl = (url: string, quality: number): string => {
    // Si c'est une URL locale, la retourner telle quelle
    if (url.startsWith('/') || url.startsWith('./')) {
      return url;
    }

    // Pour les URLs externes, on peut ajouter des paramètres d'optimisation
    // selon le service d'images utilisé (Cloudinary, ImageKit, etc.)
    try {
      const urlObj = new URL(url);
      
      // Exemple pour Cloudinary
      if (urlObj.hostname === 'cloudinary.com' || urlObj.hostname.endsWith('.cloudinary.com')) {
        return url.replace('/upload/', `/upload/q_${quality},f_auto/`);
      }

      // Exemple pour d'autres services
      // Ici on peut ajouter d'autres optimisations selon les besoins
      
      return url;
    } catch {
      return url;
    }
  };

  // Calculer les styles du conteneur
  const containerStyles = aspectRatio 
    ? { aspectRatio: `${aspectRatio}` }
    : {};

  // Composant de fallback par défaut
  const defaultFallback = (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
      <ImageIcon className="h-12 w-12 mb-2" />
      <span className="text-sm">Image non disponible</span>
    </div>
  );

  // Composant de loading
  const loadingComponent = showLoading && (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="text-xs text-gray-500">Chargement...</span>
      </div>
    </motion.div>
  );

  // Placeholder avec blur
  const placeholderComponent = (placeholder || blurDataURL) && (
    <motion.img
      src={placeholder || blurDataURL}
      alt=""
      className={`absolute inset-0 w-full h-full object-cover ${
        blurDataURL ? 'filter blur-sm' : ''
      }`}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    />
  );

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${containerClassName}`}
      style={containerStyles}
    >
      <AnimatePresence mode="wait">
        {hasError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0"
          >
            {fallback || defaultFallback}
          </motion.div>
        ) : (
          <>
            {/* Placeholder */}
            {!isLoaded && placeholderComponent}
            
            {/* Loading */}
            {isLoading && !isLoaded && loadingComponent}
            
            {/* Image principale */}
            {isInView && (
              <motion.img
                ref={imgRef}
                src={optimizeImageUrl(src, quality)}
                alt={alt}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                } ${className}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.5 }}
                {...(props as any)}
              />
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Composant d'avatar optimisé
export const LazyAvatar: React.FC<{
  src?: string;
  name: string;
  size?: number;
  className?: string;
}> = ({ src, name, size = 40, className = "" }) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const fallback = (
    <div 
      className={`flex items-center justify-center bg-gradient-to-br from-[#06B6D4] to-teal-600 text-white font-semibold rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );

  if (!src) {
    return fallback;
  }

  return (
    <LazyImage
      src={src}
      alt={name}
      containerClassName={`rounded-full ${className}`}
      className="rounded-full"
      fallback={fallback}
      aspectRatio={1}
      style={{ width: size, height: size }}
    />
  );
};

// Composant de galerie d'images optimisée
export const LazyImageGrid: React.FC<{
  images: { src: string; alt: string; id: string }[];
  columns?: number;
  gap?: number;
  onImageClick?: (image: { src: string; alt: string; id: string }) => void;
  className?: string;
}> = ({ images, columns = 3, gap = 4, onImageClick, className = "" }) => {
  return (
    <div 
      className={`grid gap-${gap} ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
      }}
    >
      {images.map((image) => (
        <motion.div
          key={image.id}
          className="relative cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
          onClick={() => onImageClick?.(image)}
        >
          <LazyImage
            src={image.src}
            alt={image.alt}
            aspectRatio={1}
            className="group-hover:brightness-110 transition-all duration-300"
            containerClassName="rounded-lg overflow-hidden"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
};

export default LazyImage;