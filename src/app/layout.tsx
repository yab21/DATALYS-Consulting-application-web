"use client";
// Import polyfills
import "@/lib/polyfills";
/*import "jsvectormap/dist/css/jsvectormap.css";*/
import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import { NotificationProvider } from "@/components/UI/Notifications/NotificationSystem";
import { PerformanceUtils } from "@/components/Optimizations";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
    
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
  }, []);

  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        <NotificationProvider>
          {loading ? <Loader /> : children}
        </NotificationProvider>
      </body>
    </html>
  );
}
