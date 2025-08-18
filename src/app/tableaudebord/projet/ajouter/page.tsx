import React from "react";
import AjouterProjet from "@/components/TableauDeBord/Projet/AjouterProjet";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Création de projet | DATALYS Consulting",
  description: "La page de création de projet de DATALYS Consulting",
};

const Page = () => {
  return <AjouterProjet />;
};

export default Page;
