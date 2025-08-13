"use client";
import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/TableauDeBord/Sidebar";
import Header from "@/components/TableauDeBord/Header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
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
            <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-screen-2xl flex-col p-4 md:p-6 2xl:p-10">
              <div className="flex-1">{children}</div>
              <footer className="mt-auto py-4">
                <div className="flex justify-center">
                  <p className="text-sm text-dark md:text-base">
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
    </>
  );
}
