"use client";
//import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import TokenExpirationHandler from "@/components/Security/TokenExpirationHandler";
import { NotificationProvider } from "@/components/UI/Notifications/NotificationProvider";
import ErrorBoundary from "@/components/UI/ErrorBoundary/ErrorBoundary";
import { useGlobalLoading } from "@/context/GlobalLoadingContext";

export default function TableauDeBordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const { showNavigationLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    // Utiliser le GlobalLoader au lieu de l'ancien loader
    showNavigationLoading("Chargement du tableau de bord...");
    
    const timer = setTimeout(() => {
      setLoading(false);
      hideLoading();
    }, 1000);

    return () => clearTimeout(timer);
  }, [showNavigationLoading, hideLoading]);

  // Pages qui utilisent déjà leur propre layout (page principale)
  const pagesWithOwnLayout = ['/tableaudebord'];
  
  // Si c'est la page principale, ne pas wrapper avec DefaultLayout
  const shouldUseDefaultLayout = !pagesWithOwnLayout.includes(pathname);

  if (loading) {
    return (
      <ProtectedRoute>
        {/* Le GlobalLoader s'occupe de l'affichage */}
        <div />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <TokenExpirationHandler>
          <NotificationProvider position="top-right" maxNotifications={5}>
            <NextUIProvider>
              {shouldUseDefaultLayout ? (
                <DefaultLayout>
                  {children}
                </DefaultLayout>
              ) : (
                children
              )}
            </NextUIProvider>
          </NotificationProvider>
        </TokenExpirationHandler>
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
