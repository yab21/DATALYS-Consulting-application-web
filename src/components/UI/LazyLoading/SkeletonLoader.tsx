"use client";

import { motion } from "framer-motion";

interface SkeletonProps {
  className?: string;
  variant?: "rectangle" | "circle" | "text" | "card" | "table" | "dashboard";
  lines?: number;
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = "",
  variant = "rectangle",
  lines = 3,
  width,
  height,
}) => {
  const baseClasses = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded";

  const getVariantClasses = () => {
    switch (variant) {
      case "circle":
        return "rounded-full";
      case "text":
        return "h-4 rounded";
      case "card":
        return "h-64 rounded-xl";
      case "table":
        return "h-12 rounded-lg";
      case "dashboard":
        return "h-48 rounded-2xl";
      default:
        return "rounded-lg";
    }
  };

  const getDefaultSize = () => {
    switch (variant) {
      case "circle":
        return "w-12 h-12";
      case "text":
        return "w-full h-4";
      case "card":
        return "w-full h-64";
      case "table":
        return "w-full h-12";
      case "dashboard":
        return "w-full h-48";
      default:
        return "w-full h-24";
    }
  };

  const sizeClasses = width && height ? `w-[${width}] h-[${height}]` : getDefaultSize();

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${sizeClasses}`}
            style={{
              width: index === lines - 1 ? "75%" : "100%",
            }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.1,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${getVariantClasses()} ${sizeClasses} ${className}`}
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  );
};

// Skeletons prédéfinis pour des cas d'usage courants
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
    <div className="flex items-center space-x-4 mb-4">
      <Skeleton variant="circle" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton variant="text" lines={3} />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = "" 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <Skeleton variant="circle" className="w-8 h-8" />
        <Skeleton variant="text" className="flex-1 h-4" />
        <Skeleton variant="text" className="w-20 h-4" />
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
    ))}
  </div>
);

export const SkeletonDashboard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="circle" className="w-8 h-8" />
        </div>
        <Skeleton variant="text" className="h-8 w-20 mb-2" />
        <Skeleton variant="text" className="h-3 w-16" />
      </div>
    ))}
  </div>
);

export default Skeleton;