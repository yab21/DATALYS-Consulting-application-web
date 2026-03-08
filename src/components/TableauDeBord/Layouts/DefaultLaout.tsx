"use client";
import React, { useState, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Sidebar from "@/components/TableauDeBord/Sidebar";
import Header from "@/components/TableauDeBord/Header";
import { NotificationProvider } from "@/context/NotificationContext";
import { NotificationProvider as SimpleNotificationProvider } from "@/components/UI/Notifications/NotificationProvider";
import { AdvancedNotificationProvider } from "@/components/UI/Notifications/AdvancedNotificationProvider";
import FCMInitializer from "@/components/UI/Notifications/FCMInitializer";
import NotificationBridge from "@/components/UI/Notifications/NotificationBridge";
import ErrorBoundary from "@/components/UI/ErrorBoundary/ErrorBoundary";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <ErrorBoundary>
      <AdvancedNotificationProvider>
        <FCMInitializer />
        <NotificationBridge />
        <SimpleNotificationProvider>
          <NotificationProvider>
          {/* <!-- ===== Page Wrapper Star ===== --> */}
          <div className="flex h-screen overflow-hidden">
            {/* <!-- ===== Sidebar Star ===== --> */}
            <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
            {/* <!-- ===== Sidebar End ===== --> */}

            {/* <!-- ===== Content Area Star ===== --> */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
              {/* <!-- ===== Header Star ===== --> */}
              <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* <!-- ===== Header End ===== --> */}

              {/* <!-- ===== Main Content Star ===== --> */}
              <main className="flex-1">
                <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 flex flex-col min-h-[calc(100vh-80px)]">
                  <div className="flex-1 pb-8">
                    {children}
                  </div>
                  <footer className="mt-8 py-4 border-t border-gray-200/30 bg-gradient-to-br from-gray-50/80 via-white/60 to-gray-100/40 backdrop-blur-sm dark:border-gray-600/40 dark:from-gray-800/90 dark:via-gray-700/70 dark:to-gray-600/50">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-screen-2xl mx-auto px-4">
                      {/* Section droits d'auteur */}
                      <div className="flex justify-center md:justify-start">
                        <p className="text-dark dark:text-gray-300 text-sm md:text-base">
                          All Rights Reserved by
                          <Link
                            className="ml-1 font-medium text-primary"
                            href="https://www.datalysconsulting.com/"
                            target="_blank"
                          >
                            DATALYS Consulting
                          </Link>
                        </p>
                      </div>
                      
                      {/* Section informations entreprise (déplacée de la sidebar) */}
                      <motion.div
                        className="flex items-center gap-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                      >
                        {/* Logo avec effet de lueur */}
                        <motion.div
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-secondary to-primary/80 p-2 shadow-lg shadow-primary/20 ring-2 ring-primary/20 dark:from-primary dark:via-secondary dark:to-primary/80 dark:shadow-primary/30 dark:ring-primary/30"
                          whileHover={{ scale: 1.05, rotate: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <svg
                            className="h-5 w-5 text-white drop-shadow-sm"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>

                        {/* Informations de l'entreprise */}
                        <div className="flex items-center gap-4">
                          <div className="text-center md:text-left">
                            <motion.p
                              className="text-sm font-bold text-gray-800 dark:text-gray-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                            >
                              DATALYS Consulting
                            </motion.p>
                            <motion.p
                              className="text-xs text-gray-600 dark:text-gray-400"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                            >
                              Version 2.0
                            </motion.p>
                          </div>

                          {/* Statut en ligne */}
                          <motion.div
                            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 shadow-sm dark:from-green-900/40 dark:to-emerald-900/40"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="h-2 w-2 animate-pulse rounded-full bg-gradient-to-r from-green-500 to-emerald-500" />
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                              En ligne
                            </span>
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>
                  </footer>
                </div>
              </main>
              {/* <!-- ===== Main Content End ===== --> */}
            </div>
            {/* <!-- ===== Content Area End ===== --> */}
          </div>
          {/* <!-- ===== Page Wrapper End ===== --> */}
          </NotificationProvider>
        </SimpleNotificationProvider>
      </AdvancedNotificationProvider>
    </ErrorBoundary>
  );
}
