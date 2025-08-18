import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import React from "react";
import ModernDashboard from "@/components/TableauDeBord/Dashboard/ModernDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord | DATALYS Consulting",
  description: "Le tableau de bord",
};

export default function Home() {
  return (
    <NextUIProvider>
      <DefaultLayout>
        <ModernDashboard />
      </DefaultLayout>
    </NextUIProvider>
  );
}
