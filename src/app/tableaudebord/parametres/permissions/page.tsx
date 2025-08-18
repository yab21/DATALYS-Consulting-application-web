import { Metadata } from "next";
import GestionPermissions from "@/components/TableauDeBord/Parametres/GestionPermissions";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion des Permissions | DATALYS Consulting",
  description: "Administration des permissions utilisateurs - Attribution et gestion des accès",
};

export default function GestionPermissionsPage() {
  return (
    <>
      <Breadcrumb pageName="Gestion des Permissions" />
      <GestionPermissions />
    </>
  );
}