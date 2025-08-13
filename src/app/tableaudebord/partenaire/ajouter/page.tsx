import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import React from "react";
import AjouterPartenaire from "@/components/TableauDeBord/Partenaire/Ajouter/index";

export const metadata: Metadata = {
  title: "Ajouter Partenaire | DATALYS Consulting",
  description: "Ajouter un nouveau partenaire DATALYS",
};

export default function AjouterPartenairePage() {
  return (
    <NextUIProvider>
      <DefaultLayout>
        <AjouterPartenaire />
      </DefaultLayout>
    </NextUIProvider>
  );
}