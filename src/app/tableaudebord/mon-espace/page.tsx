import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLayout";
import MonEspacePartenaire from "@/components/TableauDeBord/MonEspace";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Mon Espace Partenaire | DATALYS Consulting",
  description: "Dashboard personnel pour les partenaires - Projets, documents et statistiques",
};

export default function MonEspacePage() {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Mon Espace Partenaire" />
      <MonEspacePartenaire />
    </DefaultLayout>
  );
}