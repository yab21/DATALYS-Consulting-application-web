"use client";

import React from "react";
import { Breadcrumbs, BreadcrumbItem, Skeleton } from "@heroui/react";
import { ChevronRight, Home } from "lucide-react";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";

interface BreadcrumbProps {
  pageName?: string; // Optionnel pour compatibilité avec l'ancien système
  className?: string;
}

const Breadcrumb = ({ className = "" }: BreadcrumbProps) => {
  const { breadcrumbs, isLoading } = useBreadcrumb();

  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end ${className}`}>

      {/* Navigation Breadcrumb */}
      <nav className="flex items-center">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        ) : (
          <Breadcrumbs
            separator={<ChevronRight className="h-4 w-4 text-gray-400" />}
            classNames={{
              list: "gap-2",
              separator: "px-1"
            }}
          >
            {breadcrumbs.map((breadcrumb, index) => (
              <BreadcrumbItem
                key={`${breadcrumb.href}-${index}`}
                href={breadcrumb.isActive ? undefined : breadcrumb.href}
                className={`px-2 py-1 rounded-md transition-colors text-sm font-medium ${
                  breadcrumb.isActive 
                    ? "text-primary bg-primary/10 pointer-events-none" 
                    : "text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                startContent={
                  breadcrumb.href === '/tableaudebord' ? (
                    <Home className="h-4 w-4" />
                  ) : undefined
                }
              >
                {breadcrumb.label}
              </BreadcrumbItem>
            ))}
          </Breadcrumbs>
        )}
      </nav>
    </div>
  );
};

export default Breadcrumb;
