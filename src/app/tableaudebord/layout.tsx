"use client";
//import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React from "react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { usePathname } from "next/navigation";
import TokenExpirationHandler from "@/components/Security/TokenExpirationHandler";
import ErrorBoundary from "@/components/UI/ErrorBoundary/ErrorBoundary";

export default function TableauDeBordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Pages qui utilisent déjà leur propre layout (page principale)
  const pagesWithOwnLayout = ['/tableaudebord'];
  
  // Si c'est la page principale, ne pas wrapper avec DefaultLayout
  const shouldUseDefaultLayout = !pagesWithOwnLayout.includes(pathname);

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <TokenExpirationHandler>
          {shouldUseDefaultLayout ? (
            <DefaultLayout>
              {children}
            </DefaultLayout>
          ) : (
            children
          )}
        </TokenExpirationHandler>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
