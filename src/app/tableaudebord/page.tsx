import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import React from "react";
import ModernDashboard from "@/components/TableauDeBord/Dashboard/ModernDashboard";

export const metadata: Metadata = {
  title: "Tableau de bord | DATALYS Consulting",
  description: "Le tableau de bord",
};

export default function Home() {
  return (
    <DefaultLayout>
      <ModernDashboard />
    </DefaultLayout>
  );
}
