import { Metadata } from "next";
import ListeUtilisateurs from "@/components/TableauDeBord/GestionUtilisateurs/ListeUtilisateurs";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion des Utilisateurs | DATALYS Consulting",
  description: "Administration des comptes utilisateurs - Admins et Partenaires",
};

export default function GestionUtilisateursPage() {
  return (
    <>
      <Breadcrumb pageName="Gestion des Utilisateurs" />
      <ListeUtilisateurs />
    </>
  );
}