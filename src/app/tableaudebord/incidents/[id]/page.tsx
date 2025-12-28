import { Metadata } from "next";
import VoirIncident from "@/components/TableauDeBord/Incident/VoirIncident";

export const metadata: Metadata = {
  title: "Détails de l'incident | DATALYS Consulting",
  description: "Informations détaillées de l'incident, statut, priorité, SLA et historique",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <VoirIncident id={id} />;
};

export default Page;