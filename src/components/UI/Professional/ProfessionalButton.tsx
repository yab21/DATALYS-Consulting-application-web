"use client";

import React from "react";
import { Button } from "@heroui/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProfessionalButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  isDisabled?: boolean;
  fullWidth?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  onPress?: () => void;
  href?: string;
  target?: string;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  shadow?: "none" | "sm" | "md" | "lg";
  animate?: boolean;
  disableRipple?: boolean;
}

const ProfessionalButton: React.FC<ProfessionalButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
  fullWidth = false,
  startContent,
  endContent,
  className = "",
  type = "button",
  onClick,
  onPress,
  href,
  target,
  radius = "md",
  shadow = "sm",
  animate = true,
  disableRipple = false,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return {
          color: "primary" as const,
          className: "bg-[#4ba9b7] hover:bg-[#3a8a95] text-white font-medium shadow-sm hover:shadow-md",
        };
      case "secondary":
        return {
          color: "secondary" as const,
          className: "bg-secondary-600 hover:bg-secondary-700 text-white font-medium shadow-sm hover:shadow-md",
        };
      case "outline":
        return {
          color: "default" as const,
          variant: "bordered" as const,
          className: "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium",
        };
      case "ghost":
        return {
          color: "default" as const,
          variant: "light" as const,
          className: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium",
        };
      case "danger":
        return {
          color: "danger" as const,
          className: "bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm hover:shadow-md",
        };
      case "success":
        return {
          color: "success" as const,
          className: "bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm hover:shadow-md",
        };
      case "warning":
        return {
          color: "warning" as const,
          className: "bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm hover:shadow-md",
        };
      default:
        return {
          color: "primary" as const,
          className: "bg-[#4ba9b7] hover:bg-[#3a8a95] text-white font-medium shadow-sm hover:shadow-md",
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          size: "sm" as const,
          className: "h-8 px-3 text-sm min-w-16",
        };
      case "lg":
        return {
          size: "lg" as const,
          className: "h-12 px-6 text-lg min-w-24",
        };
      default:
        return {
          size: "md" as const,
          className: "h-10 px-4 text-base min-w-20",
        };
    }
  };

  const variantConfig = getVariantClasses();
  const sizeConfig = getSizeClasses();

  const buttonClasses = `
    ${variantConfig.className}
    ${sizeConfig.className}
    ${fullWidth ? "w-full" : ""}
    transition-all duration-200 ease-in-out
    font-satoshi font-medium
    ${isLoading || isDisabled ? "cursor-not-allowed opacity-60" : ""}
    ${className}
  `.trim();

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        startContent
      )}
      <span className={isLoading ? "opacity-0" : ""}>{children}</span>
      {!isLoading && endContent}
    </>
  );

  const buttonProps = {
    className: buttonClasses,
    color: variantConfig.color,
    variant: variantConfig.variant || ("solid" as const),
    size: sizeConfig.size,
    isLoading,
    isDisabled: isDisabled || isLoading,
    fullWidth,
    type,
    onPress: onPress || onClick,
    href,
    target,
    radius,
    shadow,
    disableRipple,
  };

  const buttonElement = (
    <Button {...buttonProps}>
      {content}
    </Button>
  );

  // Animation d'interaction
  if (animate && !isDisabled && !isLoading) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
        className={fullWidth ? "w-full" : "inline-block"}
      >
        {buttonElement}
      </motion.div>
    );
  }

  // Animation d'entrée simple
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={fullWidth ? "w-full" : "inline-block"}
      >
        {buttonElement}
      </motion.div>
    );
  }

  return buttonElement;
};

export default ProfessionalButton;