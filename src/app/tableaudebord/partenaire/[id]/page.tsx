import { Metadata } from "next";
import DefaultLayout from "@/components/TableauDeBord/Layouts/DefaultLaout";
import { NextUIProvider } from "@nextui-org/react";
import React from "react";
import VoirPartenaire from "@/components/TableauDeBord/Partenaire/Voir/index";

export const metadata: Metadata = {
  title: "Détails Partenaire | DATALYS Consulting",
  description: "Détails du partenaire et projets associés",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function VoirPartenairePage({ params }: PageProps) {
  return (
    <NextUIProvider>
      <DefaultLayout>
        <VoirPartenaire partnerId={params.id} />
      </DefaultLayout>
    </NextUIProvider>
  );
}