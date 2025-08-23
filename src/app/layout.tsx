"use client";
// Import polyfills
import "@/lib/polyfills";
/*import "jsvectormap/dist/css/jsvectormap.css";*/
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import "@/styles/modal-fixes.css";
import React, { useEffect, useState } from "react";
import { NotificationProvider } from "@/components/UI/Notifications/NotificationSystem";
import { FastNotificationProvider } from "@/components/UI/Notifications/FastNotification";
import { PerformanceUtils } from "@/components/Optimizations";
import { AuthProvider } from "@/context/AuthContext";
import { GlobalLoadingProvider, useGlobalLoading } from "@/context/GlobalLoadingContext";
import GlobalLoader from "@/components/UI/Loading/GlobalLoader";

// Composant interne pour gérer le chargement initial
function AppContent({ children }: { children: React.ReactNode }) {
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const { showLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    // Démarrer le loading global pour le chargement initial
    showLoading('Initialisation de DATALYS...', 'general');
    
    // Simuler le temps de chargement initial
    const timer = setTimeout(() => {
      setInitialLoading(false);
      hideLoading();
    }, 1000);
    
    // Initialiser le monitoring des performances Web Vitals
    PerformanceUtils.observeWebVitals();
    
    // Mesurer la taille du bundle au chargement initial
    PerformanceUtils.measureBundleSize();
    
    // Générer un rapport de performance après le chargement
    setTimeout(() => {
      const report = PerformanceUtils.generatePerformanceReport();
      if (report) {
        console.log("🚀 DATALYS Performance Report:", report);
        
        // Log des métriques critiques
        if (report.navigation.fullyLoaded > 3000) {
          console.warn("⚠️ Page load time is above 3s:", report.navigation.fullyLoaded + "ms");
        }
        
        if (report.memory && report.memory.used > 50) {
          console.warn("⚠️ High memory usage:", report.memory.used + "MB");
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [showLoading, hideLoading]);

  if (initialLoading) {
    return null; // Le GlobalLoader s'affichera automatiquement
  }

  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <GlobalLoadingProvider>
          <AuthProvider>
            <FastNotificationProvider>
              <NotificationProvider>
                <AppContent>{children}</AppContent>
                <GlobalLoader />
              </NotificationProvider>
            </FastNotificationProvider>
          </AuthProvider>
        </GlobalLoadingProvider>
      </body>
    </html>
  );
}
