"use client";

import React from "react";
import { motion } from "framer-motion";
import LoadingSpinner from "./LoadingSpinner";
import SkeletonLoader from "./SkeletonLoader";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "progress" | "dots";
  variant?: "primary" | "secondary" | "accent" | "white";
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  progress?: number; // Pour le type progress (0-100)
  skeletonVariant?: "card" | "list" | "table" | "profile" | "project";
  skeletonCount?: number;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  type = "spinner",
  variant = "primary",
  size = "md",
  text = "Chargement...",
  progress = 0,
  skeletonVariant = "card",
  skeletonCount = 3,
  fullScreen = false,
  overlay = false,
  className = "",
}) => {
  const DotsLoader = () => (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-3 h-3 rounded-full ${
            variant === "primary" ? "bg-primary-500" :
            variant === "secondary" ? "bg-secondary-500" :
            variant === "accent" ? "bg-accent-500" : "bg-white"
          }`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
      {text && (
        <motion.span
          className="ml-3 text-gray-600 dark:text-gray-300"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );

  const ProgressLoader = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {text}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${
            variant === "primary" ? "bg-primary-500" :
            variant === "secondary" ? "bg-secondary-500" :
            variant === "accent" ? "bg-accent-500" : "bg-white"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );

  const DatalysBrandedLoader = () => (
    <motion.div
      className="flex flex-col items-center justify-center space-y-6 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo DATALYS avec animation */}
      <motion.div
        className="relative"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-xl">
          <motion.div
            className="text-white font-bold text-2xl"
            animate={{
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            D
          </motion.div>
        </div>
        
        {/* Cercles animés autour du logo */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary-500/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Texte avec animation de typing */}
      <div className="text-center">
        <motion.h3
          className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          DATALYS Consulting
        </motion.h3>
        <motion.p
          className="text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {text}
        </motion.p>
      </div>

      {/* Barre de progression stylisée */}
      <motion.div
        className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
    </motion.div>
  );

  const containerClasses = `
    ${fullScreen ? "fixed inset-0 z-50" : ""}
    ${overlay ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm" : ""}
    ${fullScreen || overlay ? "flex items-center justify-center" : ""}
    ${className}
  `;

  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return (
          <LoadingSpinner
            size={size}
            variant={variant}
            text={text}
            fullScreen={false}
          />
        );
      case "skeleton":
        return (
          <SkeletonLoader
            variant={skeletonVariant}
            count={skeletonCount}
          />
        );
      case "progress":
        return <ProgressLoader />;
      case "dots":
        return <DotsLoader />;
      default:
        return <DatalysBrandedLoader />;
    }
  };

  if (fullScreen || overlay) {
    return (
      <div className={containerClasses}>
        {type === "skeleton" ? (
          <div className="w-full max-w-4xl mx-auto p-4">
            {renderLoader()}
          </div>
        ) : (
          renderLoader()
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {renderLoader()}
    </div>
  );
};

export default LoadingState;