import { Metadata } from "next";
import GestionIncidents from "@/components/TableauDeBord/Incidents/GestionIncidents";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion des Incidents | DATALYS Consulting",
  description: "Gestion centralisée des incidents et problèmes techniques de tous les partenaires",
};

export default function IncidentsPage() {
  return (
    <>
      <Breadcrumb pageName="Gestion des Incidents" />
      <GestionIncidents />
    </>
  );
}