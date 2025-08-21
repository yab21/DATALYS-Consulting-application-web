import { Metadata } from "next";
import MonEspacePartenaire from "@/components/TableauDeBord/MonEspace";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Mon Espace Partenaire | DATALYS Consulting",
  description: "Dashboard personnel pour les partenaires - Projets, documents et statistiques",
};

export default function MonEspacePage() {
  return (
    <>
      <Breadcrumb pageName="Mon Espace Partenaire" />
      <MonEspacePartenaire />
    </>
  );
}