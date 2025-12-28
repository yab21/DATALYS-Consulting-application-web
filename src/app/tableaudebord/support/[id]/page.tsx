import { Metadata } from "next";
import VoirSupport from "@/components/TableauDeBord/Support/VoirSupport";

export const metadata: Metadata = {
  title: "Détails du ticket de support | DATALYS Consulting",
  description: "Informations détaillées du ticket de support, statut, priorité, SLA et historique",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <VoirSupport id={id} />;
};

export default Page;