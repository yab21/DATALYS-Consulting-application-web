import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import React from "react";
import ListePartenaires from "@/components/TableauDeBord/Partenaire/Liste/index";

export const metadata: Metadata = {
  title: "Liste des Partenaires | DATALYS Consulting",
  description: "Gestion des partenaires DATALYS",
};

export default function ListePartenairesPage() {
  return (
    <NextUIProvider>
      <DefaultLayout>
        <ListePartenaires />
      </DefaultLayout>
    </NextUIProvider>
  );
}