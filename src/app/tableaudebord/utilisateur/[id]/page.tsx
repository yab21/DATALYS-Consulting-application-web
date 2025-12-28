import { Metadata } from "next";
import VoirUtilisateur from "@/components/TableauDeBord/Utilisateur/VoirUtilisateur";

export const metadata: Metadata = {
  title: "Détails de l'utilisateur | DATALYS Consulting",
  description: "Informations détaillées de l'utilisateur, rôle, permissions et activité",
};

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <VoirUtilisateur id={id} />;
};

export default Page;