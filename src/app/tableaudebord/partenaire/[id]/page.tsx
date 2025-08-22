import { Metadata } from "next";
import React from "react";
import VoirPartenaire from "@/components/TableauDeBord/Partenaire/Voir/index";

export const metadata: Metadata = {
  title: "Détails Partenaire | DATALYS Consulting",
  description: "Détails du partenaire et projets associés",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VoirPartenairePage({ params }: PageProps) {
  const { id } = await params;
  
  return <VoirPartenaire partnerId={id} />;
}