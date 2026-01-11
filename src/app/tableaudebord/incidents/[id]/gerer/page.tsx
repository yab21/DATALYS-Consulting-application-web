import { Metadata } from "next";
import GererIncident from "@/components/TableauDeBord/Incidents/GererIncident";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion de l'incident | DATALYS Consulting",
  description: "Gestion complète de l'incident : notes de résolution, fichiers, réaffectation et priorité",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  
  return (
    <>
      <Breadcrumb pageName={`Gestion de l'incident #${id}`} />
      <GererIncident id={id} />
    </>
  );
};

export default Page;