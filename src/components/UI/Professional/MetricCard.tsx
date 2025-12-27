"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
  trend?: "up" | "down" | "neutral";
  trendValue?: string | number;
  className?: string;
  isLoading?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = "primary",
  trend,
  trendValue,
  className = "",
  isLoading = false,
  onClick,
  size = "md",
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return {
          bg: "bg-[#e0f4f6] dark:bg-[#4ba9b7]/20",
          border: "border-[#4ba9b7]/30 dark:border-[#4ba9b7]/50",
          iconColor: "text-[#4ba9b7] dark:text-[#7bc5cd]",
          titleColor: "text-[#3a8a95] dark:text-[#7bc5cd]",
          valueColor: "text-[#2f7177] dark:text-[#4ba9b7]",
        };
      case "secondary":
        return {
          bg: "bg-secondary-50 dark:bg-secondary-900/20",
          border: "border-secondary-200 dark:border-secondary-700",
          iconColor: "text-secondary-600 dark:text-secondary-400",
          titleColor: "text-secondary-700 dark:text-secondary-300",
          valueColor: "text-secondary-800 dark:text-secondary-200",
        };
      case "success":
        return {
          bg: "bg-green-50 dark:bg-green-900/20",
          border: "border-green-200 dark:border-green-700",
          iconColor: "text-green-600 dark:text-green-400",
          titleColor: "text-green-700 dark:text-green-300",
          valueColor: "text-green-800 dark:text-green-200",
        };
      case "warning":
        return {
          bg: "bg-orange-50 dark:bg-orange-900/20",
          border: "border-orange-200 dark:border-orange-700",
          iconColor: "text-orange-600 dark:text-orange-400",
          titleColor: "text-orange-700 dark:text-orange-300",
          valueColor: "text-orange-800 dark:text-orange-200",
        };
      case "danger":
        return {
          bg: "bg-red-50 dark:bg-red-900/20",
          border: "border-red-200 dark:border-red-700",
          iconColor: "text-red-600 dark:text-red-400",
          titleColor: "text-red-700 dark:text-red-300",
          valueColor: "text-red-800 dark:text-red-200",
        };
      case "info":
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20",
          border: "border-blue-200 dark:border-blue-700",
          iconColor: "text-blue-600 dark:text-blue-400",
          titleColor: "text-blue-700 dark:text-blue-300",
          valueColor: "text-blue-800 dark:text-blue-200",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-800",
          border: "border-gray-200 dark:border-gray-700",
          iconColor: "text-gray-600 dark:text-gray-400",
          titleColor: "text-gray-700 dark:text-gray-300",
          valueColor: "text-gray-800 dark:text-gray-200",
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          padding: "p-4",
          iconSize: "h-5 w-5",
          titleSize: "text-sm",
          valueSize: "text-lg",
          subtitleSize: "text-xs",
        };
      case "lg":
        return {
          padding: "p-8",
          iconSize: "h-8 w-8",
          titleSize: "text-lg",
          valueSize: "text-3xl",
          subtitleSize: "text-base",
        };
      default:
        return {
          padding: "p-6",
          iconSize: "h-6 w-6",
          titleSize: "text-base",
          valueSize: "text-2xl",
          subtitleSize: "text-sm",
        };
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "neutral":
        return <Minus className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600 dark:text-green-400";
      case "down":
        return "text-red-600 dark:text-red-400";
      case "neutral":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "";
    }
  };

  const variantClasses = getVariantClasses();
  const sizeClasses = getSizeClasses();

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2 w-3/4"></div>
      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-1 w-1/2"></div>
      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
    </div>
  );

  const cardContent = (
    <div
      className={`
        ${variantClasses.bg}
        ${variantClasses.border}
        ${sizeClasses.padding}
        border rounded-lg
        font-satoshi
        ${onClick ? "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-[#4ba9b7]/40" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && (
                <div className={`${variantClasses.iconColor} ${sizeClasses.iconSize} flex-shrink-0`}>
                  {React.cloneElement(icon as React.ReactElement<any>, {
                    className: sizeClasses.iconSize,
                  })}
                </div>
              )}
              <h3 className={`${variantClasses.titleColor} ${sizeClasses.titleSize} font-medium`}>
                {title}
              </h3>
            </div>
            
            <div className="space-y-1">
              <p className={`${variantClasses.valueColor} ${sizeClasses.valueSize} font-bold`}>
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              
              {subtitle && (
                <p className={`${variantClasses.titleColor} ${sizeClasses.subtitleSize} opacity-80`}>
                  {subtitle}
                </p>
              )}
              
              {(trend || trendValue) && (
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon()}
                  {trendValue && (
                    <span className={`${sizeClasses.subtitleSize} font-medium ${getTrendColor()}`}>
                      {typeof trendValue === "number" ? `${trendValue > 0 ? "+" : ""}${trendValue}%` : trendValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Ajouter une animation si cliquable
  if (onClick) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
};

export default MetricCard;