import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLayout";
import DashboardAdmin from "@/components/TableauDeBord/Analytics/DashboardAdmin";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Analytics Admin | DATALYS Consulting",
  description: "Dashboard d'analytics et de performances globales pour les administrateurs",
};

export default function AnalyticsPage() {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Analytics & Reporting" />
      <DashboardAdmin />
    </DefaultLayout>
  );
}