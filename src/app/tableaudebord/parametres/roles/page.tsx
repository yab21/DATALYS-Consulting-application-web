import { Metadata } from "next";
import GestionRoles from "@/components/TableauDeBord/Parametres/GestionRoles";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion des Rôles | DATALYS Consulting",
  description: "Administration des rôles utilisateurs - Création et modification des rôles",
};

export default function GestionRolesPage() {
  return (
    <>
      <Breadcrumb pageName="Gestion des Rôles" />
      <GestionRoles />
    </>
  );
}