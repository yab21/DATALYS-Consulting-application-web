"use client";
import React, { useState, ReactNode } from "react";
import Link from "next/link";
import Sidebar from "@/components/TableauDeBord/Sidebar";
import Header from "@/components/TableauDeBord/Header";
import { NotificationProvider } from "@/context/NotificationContext";
import { AdvancedNotificationProvider } from "@/components/UI/Notifications/AdvancedNotificationProvider";
import FCMInitializer from "@/components/UI/Notifications/FCMInitializer";
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
                  <div className="flex-1">
                    {children}
                  </div>
                  <footer className="mt-auto py-4">
                    <div className="flex justify-center">
                      <p className="text-dark text-sm md:text-base">
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
                  </footer>
                </div>
              </main>
              {/* <!-- ===== Main Content End ===== --> */}
            </div>
            {/* <!-- ===== Content Area End ===== --> */}
          </div>
          {/* <!-- ===== Page Wrapper End ===== --> */}
        </NotificationProvider>
      </AdvancedNotificationProvider>
    </ErrorBoundary>
  );
}
