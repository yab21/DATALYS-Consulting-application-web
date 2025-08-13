"use client";

import React from "react";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "accent" | "white";
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "primary",
  text = "Chargement...",
  showText = true,
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    primary: "border-primary-500",
    secondary: "border-secondary-500", 
    accent: "border-accent-500",
    white: "border-white",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-dark/80 backdrop-blur-sm"
    : "flex flex-col items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      {/* Spinner DATALYS avec logo intégré */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Cercle extérieur rotatif */}
        <motion.div
          className={`${sizeClasses[size]} ${colorClasses[variant]} border-4 border-t-transparent rounded-full`}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Cercle intérieur avec effet de pulsation */}
        <motion.div
          className={`absolute ${sizeClasses[size]} ${colorClasses[variant]} border-2 border-opacity-30 rounded-full`}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3] 
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Point central DATALYS */}
        <motion.div
          className={`absolute w-2 h-2 ${variant === 'white' ? 'bg-white' : 'bg-primary-500'} rounded-full`}
          animate={{ 
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Texte de chargement avec animation */}
      {showText && (
        <motion.div
          className={`mt-4 ${textSizes[size]} font-medium text-gray-600 dark:text-gray-300`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.span
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {text}
          </motion.span>
          <motion.span
            className="ml-1"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              delay: 0.5 
            }}
          >
            •••
          </motion.span>
        </motion.div>
      )}
    </div>
  );
};

export default LoadingSpinner;