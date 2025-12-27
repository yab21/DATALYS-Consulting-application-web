"use client";

import React from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "large" | "compact" | "centered";
  color?: "default" | "primary" | "secondary" | "muted";
  divider?: boolean;
  className?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  animate?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  children,
  actions,
  variant = "default",
  color = "default",
  divider = false,
  className = "",
  level = 2,
  animate = true,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "large":
        return {
          container: "py-6",
          title: "text-3xl font-bold",
          subtitle: "text-lg",
          spacing: "space-y-3",
        };
      case "compact":
        return {
          container: "py-2",
          title: "text-lg font-semibold",
          subtitle: "text-sm",
          spacing: "space-y-1",
        };
      case "centered":
        return {
          container: "py-4 text-center",
          title: "text-2xl font-bold",
          subtitle: "text-base",
          spacing: "space-y-2",
        };
      default:
        return {
          container: "py-4",
          title: "text-xl font-semibold",
          subtitle: "text-base",
          spacing: "space-y-2",
        };
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case "primary":
        return {
          title: "text-[#3a8a95] dark:text-[#4ba9b7]",
          subtitle: "text-[#4ba9b7] dark:text-[#7bc5cd]",
          icon: "text-[#4ba9b7] dark:text-[#7bc5cd]",
        };
      case "secondary":
        return {
          title: "text-secondary-800 dark:text-secondary-200",
          subtitle: "text-secondary-600 dark:text-secondary-400",
          icon: "text-secondary-600 dark:text-secondary-400",
        };
      case "muted":
        return {
          title: "text-gray-600 dark:text-gray-400",
          subtitle: "text-gray-500 dark:text-gray-500",
          icon: "text-gray-500 dark:text-gray-500",
        };
      default:
        return {
          title: "text-gray-900 dark:text-white",
          subtitle: "text-gray-600 dark:text-gray-400",
          icon: "text-gray-700 dark:text-gray-300",
        };
    }
  };

  const getHeadingTag = () => {
    const Tag = `h${level}` as React.ElementType;
    return Tag;
  };

  const variantClasses = getVariantClasses();
  const colorClasses = getColorClasses();
  const HeadingTag = getHeadingTag();

  const containerClass = `
    ${variantClasses.container}
    ${variant === "centered" ? "text-center" : ""}
    ${divider ? "border-b border-gray-200 dark:border-gray-700" : ""}
    font-satoshi
    ${className}
  `.trim();

  const headerContent = (
    <div className={containerClass}>
      <div className={variantClasses.spacing}>
        {/* Titre principal avec icône */}
        <div className={`flex items-center ${variant === "centered" ? "justify-center" : "justify-between"} gap-3`}>
          <div className={`flex items-center gap-3 ${variant === "centered" ? "justify-center" : ""}`}>
            {icon && (
              <div className={`${colorClasses.icon} flex-shrink-0`}>
                {React.cloneElement(icon as React.ReactElement<any>, {
                  className: variant === "large" ? "h-8 w-8" : variant === "compact" ? "h-4 w-4" : "h-5 w-5",
                })}
              </div>
            )}
            <HeadingTag className={`${variantClasses.title} ${colorClasses.title}`}>
              {title}
            </HeadingTag>
          </div>
          
          {/* Actions à droite (sauf en mode centré) */}
          {actions && variant !== "centered" && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Sous-titre */}
        {subtitle && (
          <p className={`${variantClasses.subtitle} ${colorClasses.subtitle}`}>
            {subtitle}
          </p>
        )}

        {/* Contenu additionnel */}
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}

        {/* Actions en mode centré */}
        {actions && variant === "centered" && (
          <div className="flex items-center justify-center gap-2 mt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );

  // Animation d'entrée
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {headerContent}
      </motion.div>
    );
  }

  return headerContent;
};

export default SectionHeader;