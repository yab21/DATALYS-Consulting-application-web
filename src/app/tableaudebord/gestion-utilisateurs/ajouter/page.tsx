import { Metadata } from "next";
import AjouterUtilisateur from "@/components/TableauDeBord/GestionUtilisateurs/AjouterUtilisateur";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Ajouter un Utilisateur | DATALYS Consulting",
  description: "Créer un nouveau compte administrateur ou partenaire",
};

export default function AjouterUtilisateurPage() {
  return (
    <>
      <Breadcrumb pageName="Ajouter un Utilisateur" />
      <AjouterUtilisateur />
    </>
  );
}