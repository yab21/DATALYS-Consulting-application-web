"use client";
// Import polyfills
import "@/lib/polyfills";
/*import "jsvectormap/dist/css/jsvectormap.css";*/
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import "@/styles/modal-fixes.css";
// TopBarProgress styles
import "nprogress/nprogress.css";
import "@/styles/nprogress.css";
import React, { useEffect, useState } from "react";
import { SimpleNotificationProvider } from "@/components/UI/Notifications/SimpleNotificationSystem";
import { PerformanceUtils } from "@/components/Optimizations";
import { AuthProvider } from "@/context/AuthContext";
import { useTopBarProgress } from "@/hooks/useTopBarProgress";
import { NetworkProvider } from "@/components/UI/NetworkStatus/NetworkProvider";
// Toaster sera fourni par NetworkProvider

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { configure } = useTopBarProgress();

  useEffect(() => {
    // Configuration du TopBarProgress pour DATALYS
    configure({
      minimum: 0.15,
      speed: 400,
      showSpinner: false,
      easing: 'ease-out',
      trickleSpeed: 200,
    });
    
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
  }, [configure]);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <AuthProvider>
          <NetworkProvider 
            showIndicator={true}
            indicatorPosition="top-right"
            enableAutoSync={true}
            enableToasts={true}
          >
            <SimpleNotificationProvider>
              {children}
            </SimpleNotificationProvider>
          </NetworkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
