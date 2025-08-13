"use client";

import React from "react";
import { motion } from "framer-motion";

interface SkeletonLoaderProps {
  variant?: "card" | "list" | "table" | "profile" | "project";
  count?: number;
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "card",
  count = 1,
  className = "",
}) => {
  const shimmerVariants = {
    initial: { backgroundPosition: "-200% 0" },
    animate: { backgroundPosition: "200% 0" },
  };

  const baseClasses = "bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] rounded-lg animate-pulse";

  const CardSkeleton = () => (
    <motion.div
      className={`${baseClasses} p-6 space-y-4 ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
      </div>
    </motion.div>
  );

  const ListSkeleton = () => (
    <motion.div
      className={`${baseClasses} p-4 flex items-center space-x-4 ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
      </div>
      <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
    </motion.div>
  );

  const TableSkeleton = () => (
    <motion.div
      className={`${baseClasses} p-0 ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      {/* En-tête du tableau */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-600">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-1 h-4 bg-gray-300 dark:bg-gray-600 rounded mx-2"></div>
        ))}
      </div>
      {/* Lignes du tableau */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex items-center p-4 border-b border-gray-100 dark:border-gray-700">
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1 mx-2">
              <div className={`h-3 bg-gray-300 dark:bg-gray-600 rounded ${colIndex === 0 ? 'w-3/4' : 'w-full'}`}></div>
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );

  const ProfileSkeleton = () => (
    <motion.div
      className={`${baseClasses} p-6 ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-gray-300 dark:bg-gray-600 rounded-full mb-4"></div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-4"></div>
        <div className="space-y-2 w-full">
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-4/5"></div>
          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-3/5"></div>
        </div>
      </div>
    </motion.div>
  );

  const ProjectSkeleton = () => (
    <motion.div
      className={`${baseClasses} p-6 space-y-6 ${className}`}
      variants={shimmerVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
    >
      {/* En-tête du projet */}
      <div className="flex justify-between items-start">
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-20"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-24"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded-full w-16"></div>
          </div>
        </div>
        <div className="flex space-x-2">
          <div className="w-20 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-24 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex justify-between items-center">
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded w-80"></div>
        <div className="flex space-x-2">
          <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* Grille de fichiers/dossiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg space-y-3">
            <div className="w-full h-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return <CardSkeleton />;
      case "list":
        return <ListSkeleton />;
      case "table":
        return <TableSkeleton />;
      case "profile":
        return <ProfileSkeleton />;
      case "project":
        return <ProjectSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;