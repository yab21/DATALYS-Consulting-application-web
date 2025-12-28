import { Metadata } from "next";
import VoirPartenaire from "@/components/TableauDeBord/Partenaire/VoirPartenaire";

export const metadata: Metadata = {
  title: "Détails du partenaire | DATALYS Consulting",
  description: "Informations détaillées du partenaire, projets associés, documents et dossiers",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <VoirPartenaire id={id} />;
};

export default Page;