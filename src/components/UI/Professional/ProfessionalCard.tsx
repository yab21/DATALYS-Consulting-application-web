"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { motion } from "framer-motion";

interface ProfessionalCardProps {
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "outlined" | "shadow" | "bordered" | "flat";
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  radius?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
  isBlurred?: boolean;
  isHoverable?: boolean;
  isPressable?: boolean;
  fullWidth?: boolean;
  onPress?: () => void;
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  children,
  header,
  footer,
  variant = "default",
  className = "",
  padding = "md",
  radius = "lg",
  shadow = "sm",
  isBlurred = false,
  isHoverable = true,
  isPressable = false,
  fullWidth = true,
  onPress,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "outlined":
        return "border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
      case "shadow":
        return "bg-white dark:bg-gray-800 shadow-card-2";
      case "bordered":
        return "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800";
      case "flat":
        return "bg-gray-50 dark:bg-gray-800/50";
      default:
        return "bg-white dark:bg-gray-800 shadow-card";
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case "none":
        return "p-0";
      case "sm":
        return "p-4";
      case "lg":
        return "p-8";
      default:
        return "p-6";
    }
  };

  const baseClasses = `
    ${getVariantClasses()}
    ${getPaddingClasses()}
    ${fullWidth ? "w-full" : ""}
    ${isHoverable ? "hover:shadow-card-2 transition-all duration-200" : ""}
    ${isPressable ? "cursor-pointer active:scale-[0.98]" : ""}
    rounded-${radius}
    ${className}
  `.trim();

  const cardComponent = (
    <Card
      className={baseClasses}
      isBlurred={isBlurred}
      isHoverable={isHoverable}
      isPressable={isPressable}
      onPress={onPress}
      shadow={shadow === "none" ? "none" : shadow}
      radius={radius}
    >
      {header && (
        <CardHeader className="pb-0">
          {header}
        </CardHeader>
      )}
      
      <CardBody className={header ? "pt-4" : ""}>
        {children}
      </CardBody>
      
      {footer && (
        <div className="px-6 pb-6 pt-0">
          {footer}
        </div>
      )}
    </Card>
  );

  // Ajouter une animation légère si hoverable
  if (isHoverable && !isPressable) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
        className={fullWidth ? "w-full" : ""}
      >
        {cardComponent}
      </motion.div>
    );
  }

  return cardComponent;
};

export default ProfessionalCard;