import { Metadata } from "next";
import GererSupport from "@/components/TableauDeBord/Support/GererSupport";
import Breadcrumb from "@/components/TableauDeBord/Breadcrumbs/Breadcrumb";

export const metadata: Metadata = {
  title: "Gestion du ticket de support | DATALYS Consulting",
  description: "Gestion complète du ticket de support : notes de résolution, fichiers, réaffectation et priorité",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  
  return (
    <>
      <Breadcrumb pageName={`Gestion du ticket #${id}`} />
      <GererSupport id={id} />
    </>
  );
};

export default Page;