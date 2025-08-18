import { Metadata } from "next";
import React from "react";
import ListePartenaires from "@/components/TableauDeBord/Partenaire/Liste/index";

export const metadata: Metadata = {
  title: "Liste des Partenaires | DATALYS Consulting",
  description: "Gestion des partenaires DATALYS",
};

export default function ListePartenairesPage() {
  return <ListePartenaires />;
}