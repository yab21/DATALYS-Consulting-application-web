"use client";
//import "jsvectormap/dist/css/jsvectormap.css";
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import ProtectedRoute from "@/components/Auth/ProtectedRoute";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import { usePathname } from "next/navigation";
import TokenExpirationHandler from "@/components/Security/TokenExpirationHandler";
import { NotificationProvider } from "@/components/UI/Notifications/NotificationProvider";
import ErrorBoundary from "@/components/UI/ErrorBoundary/ErrorBoundary";

export default function TableauDeBordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  // Pages qui utilisent déjà leur propre layout (page principale)
  const pagesWithOwnLayout = ['/tableaudebord'];
  
  // Si c'est la page principale, ne pas wrapper avec DefaultLayout
  const shouldUseDefaultLayout = !pagesWithOwnLayout.includes(pathname);

  if (loading) {
    return (
      <ProtectedRoute>
        <Loader />
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
